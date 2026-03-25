---
title: "Building a 12-Agent AI Risk Detection System with OpenClaw and NemoClaw"
description: "A deep technical dive into how RiskRadar uses the OpenClaw agent framework to coordinate 12 autonomous AI agents that detect compound risk patterns across enterprise domains."
tags: [ai, typescript, agents, architecture, openclaw, redis, agentic-ai]
canonical_url: https://dev.to/aimadds/12-agent-ai-risk-detection-openclaw
published: true
cover_image: https://riskradar.ai/blog/technical-deep-dive-cover.png
---

# Building a 12-Agent AI Risk Detection System with OpenClaw and NemoClaw

Most "AI-powered" enterprise tools use AI the same way: a monolithic backend calls an LLM API when it needs a completion, parses the response, and saves it to a database. The AI is a feature, not the architecture.

We took a fundamentally different approach. RiskRadar is a **multi-agent system** where 12 specialized AI agents run autonomously, each with its own lifecycle, domain expertise, communication channels, and reasoning capabilities. The agents coordinate through message passing, not function calls. They run continuously, not on-demand.

This post is a deep technical dive into how we built it: the agent lifecycle, the message bus, the fusion engine, the model router, and why we chose this architecture over traditional microservices.

---

## Why OpenClaw

[OpenClaw](https://github.com/openclaw) is an open-source agent framework designed for production agent systems. It provides:

- **Agent lifecycle management:** Init, heartbeat, signal processing, inter-agent messaging, graceful shutdown
- **SKILL.md-based expertise:** YAML frontmatter + system prompts that give agents PhD-level domain knowledge
- **MCP (Model Context Protocol) servers:** Standardized tool interfaces agents can call
- **Memory persistence:** Agents retain context across restarts
- **Workspace isolation:** Each agent has its own working directory and state

We chose OpenClaw over building a custom framework because it standardizes the primitives we needed without imposing opinions on our domain logic. The lifecycle hooks are clean, the skill system is expressive, and the MCP integration means agents can use tools without custom glue code.

**NemoClaw** (NVIDIA's enterprise security wrapper) adds kernel-level sandboxing on top — Landlock for filesystem isolation and Seccomp for syscall filtering. Every agent runs with least-privilege access. An agent that only needs to read financial data cannot touch the HR database, even if compromised.

---

## The BaseAgent Contract

Every RiskRadar agent extends `BaseAgent`, which enforces the OpenClaw lifecycle:

```typescript
export abstract class BaseAgent {
  protected context: AgentContext;
  protected logger: Logger;
  protected status: AgentStatus = 'initializing';

  // ─── Lifecycle Methods (override in subclasses) ────────────

  /** Called once when the agent starts. Setup connections, load state. */
  protected abstract onInit(): Promise<void>;

  /** Called periodically (cron schedule). Pull data, check conditions. */
  protected abstract onHeartbeat(): Promise<void>;

  /** Called when the agent receives a signal event. */
  protected abstract onSignal(signal: NormalizedSignalEvent): Promise<void>;

  /** Called when the agent receives a message from another agent. */
  protected abstract onMessage(message: AgentMessage): Promise<void>;

  /** Called when the agent is shutting down. Cleanup resources. */
  protected abstract onShutdown(): Promise<void>;
}
```

The lifecycle is simple but powerful:

1. **`onInit()`** — Agent starts, establishes database connections, loads cached state, registers with the message bus
2. **`onHeartbeat()`** — Fires on a configurable schedule (e.g., every 5 minutes). Collection agents pull data here. Analysis agents check for accumulated signals that need processing
3. **`onSignal()`** — Event-driven. When any agent emits a normalized signal, all subscribed agents receive it in real time
4. **`onMessage()`** — Direct agent-to-agent communication. The Fusion Engine sends compound risk findings to the Alert Router. The Regulatory Watchdog sends compliance updates to the Notification Agent
5. **`onShutdown()`** — Graceful cleanup. Close connections, flush buffers, persist state

Each agent declares its configuration:

```typescript
export interface AgentConfig {
  id: string;
  name: string;
  team: 'collection' | 'analysis' | 'response';
  domain?: RiskDomainType;
  schedule?: string; // e.g., '5m', '1h', '30s'
  modelTier: 'tier1_super' | 'tier2_cascade';
  dataSources: string[];
  enabled: boolean;
}
```

The `modelTier` field is critical — it determines which AI model the agent uses for reasoning. Tier 1 (`Nemotron-3-Super-120B`) handles fast monitoring tasks. Tier 2 (`Nemotron-Cascade-2-30B`) handles deep reasoning that requires chain-of-thought analysis. The model router handles the dispatch.

---

## Agent-to-Agent Communication via Redis Pub/Sub

Agents do not call each other's methods. They communicate through a typed message bus built on Redis Pub/Sub:

```typescript
export class AgentBus {
  private handlers = new Map<string, MessageHandler[]>();
  private subscriber;
  private publisher;

  async initialize(): Promise<void> {
    await this.subscriber.subscribe('riskradar:signals');
  }

  subscribe(agentId: string, handler: MessageHandler): void {
    const channel = `riskradar:agent:${agentId}`;
    this.handlers.set(channel, [...(this.handlers.get(channel) ?? []), handler]);
    this.subscriber.subscribe(channel);
  }

  async send(message: AgentMessage): Promise<void> {
    const channel = `riskradar:agent:${message.toAgentId}`;
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async broadcastToTeam(team: string, message: AgentMessage): Promise<void> {
    const channel = `riskradar:team:${team}`;
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async publishSignal(signal: NormalizedSignalEvent): Promise<void> {
    await this.publisher.publish('riskradar:signals', JSON.stringify(signal));
  }
}
```

There are three communication patterns:

1. **Signal broadcast** (`riskradar:signals`) — Collection agents publish normalized signals. Every analysis agent subscribes
2. **Direct messaging** (`riskradar:agent:{id}`) — Point-to-point. The Fusion Engine tells the Alert Router about a compound risk
3. **Team broadcast** (`riskradar:team:{team}`) — One-to-many within a team. Useful for coordinated responses

All messages are strongly typed:

```typescript
export interface CompoundRiskMessage extends AgentMessage {
  type: 'compound_risk_detected';
  payload: {
    subjectId: string;
    domains: RiskDomainType[];
    compoundScore: number;
    signalIds: string[];
    evidenceChain: Array<{
      sequence: number;
      timestamp: string;
      description: string;
      sourceSystem: string;
      signalType: string;
    }>;
    requiresDeepReasoning: boolean;
  };
}
```

Why Redis Pub/Sub over a message queue like RabbitMQ or Kafka? Three reasons:

1. **Latency.** Sub-millisecond publish-to-receive. Risk detection is time-sensitive
2. **Simplicity.** Redis is already in the stack for caching and BullMQ job queues. No additional infrastructure
3. **Fan-out.** A single signal publish reaches all subscribed analysis agents simultaneously. No consumer group management

For durability (messages that must not be lost), we use BullMQ job queues backed by the same Redis instance. Pub/Sub is for real-time coordination; BullMQ is for guaranteed processing.

---

## Signal Normalization: The Universal Language

Every data source — ERP transactions, SIEM alerts, HRIS events, badge swipes, email metadata — produces data in a different format. Collection agents normalize everything into a single schema:

```typescript
interface NormalizedSignalEvent {
  signalId: string;
  tenantId: string;
  domain: 'finance' | 'security' | 'hr' | 'operations' | 'communications';
  signalType: string;      // e.g., 'override_transaction', 'after_hours_access'
  subjectType: 'employee' | 'department' | 'vendor' | 'account';
  subjectId: string;
  sourceSystem: string;
  value: number | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
}
```

This normalization is what makes cross-domain fusion possible. The Fusion Engine does not need to understand SAP transaction formats or CrowdStrike alert schemas. It works with normalized signals.

---

## The Fusion Engine: Where Signals Become Intelligence

The Fusion Engine is the core analysis agent. It receives all normalized signals, groups them by subject, and looks for compound risk patterns that span multiple domains.

Here is how compound scoring works (from our test suite):

```typescript
it('detects compound risk with multi-domain signals', async () => {
  const signals: NormalizedSignalEvent[] = [
    createSignal('finance', 'override_transaction', 'emp-1', 50000),
    createSignal('security', 'after_hours_access', 'emp-1'),
    createSignal('hr', 'training_missed', 'emp-1'),
    createSignal('finance', 'new_payee', 'emp-1', 25000),
    createSignal('communications', 'communication_drop', 'emp-1'),
  ];

  const result = await engine.analyzeSubject('tenant-1', 'emp-1', signals);

  expect(result).not.toBeNull();
  expect(result!.compoundScore).toBeGreaterThan(25);
  expect(result!.domains).toContain('finance');
  expect(result!.domains).toContain('security');
  expect(result!.signalIds).toHaveLength(5);
});
```

Domain diversity is weighted heavily. Five signals from one domain score lower than five signals from four domains — because cross-domain correlation is what separates RiskRadar from single-domain tools.

When the compound score exceeds a configurable threshold, the Fusion Engine invokes AI reasoning:

```typescript
it('triggers AI reasoning for high compound scores', async () => {
  const highRiskSignals: NormalizedSignalEvent[] = [
    createSignal('finance', 'override_transaction', 'emp-1', 100000),
    createSignal('finance', 'approval_bypass', 'emp-1', 50000),
    createSignal('security', 'after_hours_access', 'emp-1'),
    createSignal('security', 'data_exfiltration', 'emp-1'),
    createSignal('hr', 'performance_decline', 'emp-1'),
    createSignal('communications', 'communication_drop', 'emp-1'),
    createSignal('operations', 'productivity_decline', 'emp-1'),
  ];

  const result = await engine.analyzeSubject('tenant-1', 'emp-1', highRiskSignals);

  if (result && result.compoundScore >= 50) {
    expect(mockModelRouter.infer).toHaveBeenCalled();
  }
});
```

The AI does not just confirm the score — it produces an evidence chain and reasoning narrative that becomes part of the alert's audit trail.

---

## The Model Router: Local, Cloud, or Hybrid

Not every organization has an NVIDIA A100 sitting in a rack. The model router abstracts inference behind three modes:

```
INFERENCE_MODE=local   → Full on-premises (Nemotron models via vLLM)
INFERENCE_MODE=cloud   → Claude/GPT API (no GPU needed)
INFERENCE_MODE=hybrid  → Routine monitoring via cloud, deep reasoning stays local
```

In hybrid mode, Tier 1 tasks (fast signal classification, routine heartbeat analysis) route to the cloud API. Tier 2 tasks (deep chain-of-thought reasoning about compound risk, evidence chain construction) stay on-premises where sensitive data never leaves the network.

The agent's `reason()` method is completely agnostic:

```typescript
protected async reason(
  prompt: string,
  systemPrompt: string,
  options?: { requireReasoning?: boolean; maxTokens?: number },
) {
  return this.context.modelRouter.infer({
    prompt,
    systemPrompt,
    requireReasoning: options?.requireReasoning,
    maxTokens: options?.maxTokens,
  });
}
```

---

## The Trajectory Engine: Predicting the Future

Most risk platforms give you a point-in-time score: "This employee's risk is 62 right now." The Trajectory Engine asks a better question: **Is this entity's risk accelerating, stable, or declining? When will it breach the alert threshold if the trend continues?**

```typescript
export class TrajectoryEngine {
  async calculateTrajectory(
    tenantId: string,
    subjectType: SubjectType,
    subjectId: string,
  ): Promise<TrajectoryResult> {
    // Get historical risk scores (up to 180 days)
    const scores = await prisma.riskScore.findMany({
      where: { tenantId, subjectType, subjectId },
      orderBy: { calculatedAt: 'asc' },
      take: 180,
    });

    // Linear regression for projection
    const regression = this.linearRegression(
      scores.map((s, i) => ({ x: i, y: s.overallScore })),
    );

    // Project score 14 days ahead
    const projectedScore = Math.min(
      100,
      Math.max(0, regression.slope * (scores.length + 14) + regression.intercept),
    );

    // Calculate projected breach date
    if (currentScore < thresholdHigh && regression.slope > 0) {
      const daysToBreach = Math.ceil(
        (thresholdHigh - currentScore) / regression.slope,
      );
    }
  }
}
```

The output includes trajectory classification (`accelerating`, `stable`, `declining`, `new`), projected score, projected breach date, R-squared confidence, and an intervention recommendation flag.

---

## Skills as Domain Expertise

OpenClaw's SKILL.md system lets us encode PhD-level domain knowledge into each agent. A skill is not just a prompt — it includes:

- **System prompt** with deep expertise (CFE certification knowledge, CERT/CC insider threat research, Maslach Burnout Inventory dimensions)
- **Executable tools** the agent can call during analysis (Benford's Law analysis, structuring detection, access anomaly detection)
- **Knowledge base** of domain-specific constants and thresholds

```typescript
export interface Skill {
  id: string;
  name: string;
  version: string;
  domain: string;
  tier: 'foundation' | 'domain_expert' | 'forensic' | 'regulatory';
  description: string;
  systemPrompt: string;
  tools: SkillTool[];
  knowledgeBase?: Record<string, unknown>;
}
```

For example, the Transaction Forensics skill includes a Benford's Law tool that actually runs chi-square analysis on transaction amounts to detect fabricated numbers:

```typescript
const benfords_law_tool: SkillTool = {
  name: 'benfords_law_analysis',
  description: 'Apply Benfords Law analysis to detect fabricated numbers',
  execute: async (params) => {
    const amounts = params['amounts'] as number[];
    const expected = [0, 0.301, 0.176, 0.125, 0.097, 0.079, 0.067, 0.058, 0.051, 0.046];
    const observed = new Array(10).fill(0) as number[];

    for (const amount of amounts) {
      const firstDigit = parseInt(Math.abs(amount).toString()[0]!, 10);
      observed[firstDigit]!++;
    }

    // Chi-square test at 0.05 significance
    const chiSquare = expected.reduce((sum, exp, i) => {
      if (i === 0 || exp === 0) return sum;
      const obs = observed[i]! / total;
      return sum + ((obs - exp) ** 2) / exp;
    }, 0);

    const suspicious = chiSquare > 15.507; // 8 df, alpha=0.05
    return { suspicious, chiSquare, digitDistribution };
  },
};
```

These are not toy implementations. They are the same analytical methods used by forensic accountants and fraud examiners in real investigations.

---

## Why This Architecture Over Microservices

We could have built RiskRadar as a collection of traditional microservices: a finance-monitoring service, a security-monitoring service, a fusion service, etc. Here is why we chose agents instead:

| Dimension | Microservices | Agents (OpenClaw) |
|---|---|---|
| **Communication** | REST/gRPC request-response | Asynchronous message passing |
| **State** | Stateless (externalized) | Stateful (agent maintains context) |
| **Scheduling** | External (cron, Kubernetes CronJobs) | Built-in heartbeat lifecycle |
| **Reasoning** | Call LLM, parse response | Integrated reasoning with skills and tools |
| **Coordination** | Orchestrator pattern | Autonomous with peer-to-peer messaging |
| **Domain knowledge** | In code/config | In SKILL.md with tools and knowledge bases |
| **Adaptability** | Static logic, redeploy to change | Self-learning with threshold auto-adjustment |

The key difference is **autonomy**. A microservice processes a request and returns a response. An agent runs continuously, maintains state, reasons about accumulated evidence, coordinates with peers, and adapts its behavior based on feedback. The Fusion Engine does not wait to be called — it watches signals arrive in real time and acts when patterns emerge.

---

## Performance at Scale

With 12 agents running continuously, performance matters. Here is how we keep things fast:

- **Redis Pub/Sub** for sub-millisecond agent communication
- **BullMQ** for guaranteed job processing with backpressure
- **TimescaleDB** for time-series signal storage with automatic partitioning
- **Prisma** for type-safe database access with connection pooling
- **Pino** for structured logging with PII redaction (zero-cost when disabled)

The agent bus handles message routing with minimal overhead:

```typescript
private handleIncoming(channel: string, rawMessage: string): void {
  const message = JSON.parse(rawMessage) as AgentMessage;
  const handlers = this.handlers.get(channel) ?? [];
  for (const handler of handlers) {
    handler(message);
  }
}
```

No framework overhead. No middleware chains. Raw message dispatch.

---

## Try It Yourself

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d
pnpm db:generate && pnpm db:migrate dev --name init && pnpm db:seed
pnpm dev
```

The full agent topology starts automatically. Open `http://localhost:3000` for the dashboard, and `http://localhost:3001/docs` for the API documentation.

Want to contribute? We are actively looking for:

- New collection agents (Jira, ServiceNow, Okta, AWS CloudTrail)
- Additional detection skills (anti-bribery, sanctions screening, FCPA)
- Performance benchmarks and optimizations
- Documentation improvements

Star the repo: [github.com/smaan712gb/RiskRadar](https://github.com/smaan712gb/RiskRadar)

---

*Built by [AIMADDS](https://aimadds.com). Apache 2.0 core. Powered by OpenClaw and NVIDIA NemoClaw.*
