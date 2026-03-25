---
title: "We Just Open-Sourced an AI Risk Intelligence Platform — Here's What We Built and Why"
description: "RiskRadar uses 12 autonomous AI agents built on OpenClaw to detect compound risk patterns across HR, finance, security, operations, and communications. Today we're open-sourcing the core under Apache 2.0."
tags: [open-source, ai, risk-management, compliance, agentic-ai, openclaw, enterprise]
canonical_url: https://medium.com/@aimadds/riskradar-open-source-launch
published: true
cover_image: https://riskradar.ai/blog/launch-cover.png
---

# We Just Open-Sourced an AI Risk Intelligence Platform — Here's What We Built and Why

The compliance and risk monitoring industry has a fundamental problem: it is reactive, siloed, and stuck in the rule-based era. A financial transaction trips a static threshold in one system. An employee's badge access looks odd in another. HR notices a pattern of disengagement in a third. But no one connects the dots until it is too late — until the SAR is overdue, the insider has exfiltrated data, or the regulator is already at the door.

We spent two years asking a simple question: **What if a team of specialized AI agents could watch every risk domain simultaneously, fuse signals across boundaries, and surface compound patterns that no single-domain tool would ever catch?**

Today, we are releasing the answer as open-source software.

**RiskRadar** (branded as RisksRadarAI) is an AI-driven organizational risk intelligence platform. It uses 12 always-on autonomous agents — built on the [OpenClaw](https://github.com/openclaw) agent framework with [NVIDIA NemoClaw](https://developer.nvidia.com/nemoclaw) security sandboxing — to detect compound risk patterns across HR, finance, security, operations, and communications.

The core is Apache 2.0. Free to self-host. Your data never has to leave your infrastructure.

---

## What the Industry Gets Wrong

Every enterprise we talked to runs some combination of Darktrace, Exabeam, KonaAI, Actimize, or custom SIEM rules. Here is what they all have in common:

- **Single-domain monitoring.** Your SIEM watches network logs. Your AML tool watches transactions. Your HR analytics platform watches engagement scores. Nobody watches all of them together.
- **Static rules.** "Flag transactions over $9,500." Fraudsters figured that out decades ago. Rule-based systems generate mountains of false positives and miss every novel pattern.
- **Cloud-only.** Regulated industries — banking, healthcare, defense — cannot send employee behavioral data to a third-party cloud. Yet most platforms require it.
- **Black-box scores.** You get a risk number. You do not get a reasoning chain. Good luck explaining that to a regulator or an audit committee.
- **Enterprise-only pricing.** $67K to $500K+ per year. Mid-market companies and credit unions are priced out entirely.

RiskRadar was designed from day one to solve every one of these problems.

---

## What RiskRadar Does Differently

### Cross-Domain Fusion

RiskRadar does not monitor finance OR security OR HR. It monitors the intersections. An employee who overrides a $50,000 transaction, accesses the building after hours, skips mandatory compliance training, creates a new payee, and shows declining peer communication does not trigger five independent low-priority alerts. RiskRadar's Fusion Engine correlates all five signals, calculates a compound risk score, and produces a single high-priority alert with a full evidence chain.

### Agentic Architecture on OpenClaw

This is not a monolithic application with AI bolted on. RiskRadar is a **multi-agent system** where 12 specialized AI agents run autonomously on the OpenClaw runtime. Each agent has its own lifecycle, its own domain expertise (encoded as OpenClaw SKILL.md files), and its own communication channels via Redis Pub/Sub.

OpenClaw manages the full agent lifecycle — initialization, heartbeat scheduling, signal routing, inter-agent messaging, and graceful shutdown. NemoClaw wraps each agent in a Landlock + Seccomp security sandbox, enforcing least-privilege access at the OS kernel level.

### On-Premises Data Sovereignty

Every deployment mode keeps your data under your control:

| Mode | Description | GPU Required | Data Location |
|---|---|---|---|
| **Self-Hosted** | Everything on your hardware | Optional | 100% on-prem |
| **Private Cloud** | Your AWS/GCP/Azure VPC | Optional | Your VPC |
| **Managed SaaS** | We host it | No | Our infrastructure |
| **Hybrid** | Dashboard in cloud, AI on-prem | Yes (on-prem) | Data stays local |

### Explainable AI with Evidence Briefs

Every alert includes a structured evidence chain: the signals that triggered it, the reasoning the AI used to correlate them, the regulatory frameworks that apply, and recommended investigative actions. No black boxes. Regulator-ready from day one.

---

## The 12-Agent Topology

RiskRadar's agents are organized into three teams:

```
Collection (5 agents)          Analysis (4 agents)           Response (3 agents)
├─ Finance Collector           ├─ Cross-Domain Fusion        ├─ Alert Router
├─ Security Collector          ├─ Regulatory Watchdog        ├─ Notification Agent
├─ HR Collector                ├─ Trajectory Engine          └─ SAR Generator
├─ Operations Collector        └─ Bias Check
└─ Communications Collector
```

**Collection agents** ingest data from enterprise systems — ERP, SIEM, HRIS, badge access, communication platforms — and normalize it into a unified signal format.

**Analysis agents** do the heavy lifting. The Fusion Engine correlates cross-domain signals. The Regulatory Watchdog continuously scans 12+ regulatory sources (FinCEN, OCC, FDIC, SEC, Federal Reserve, CFPB, and more). The Trajectory Engine projects risk forward using linear regression — not just "what is the score now?" but "when will this entity breach the threshold if the trend continues?" The Bias Check agent monitors for algorithmic fairness.

**Response agents** route alerts, generate notifications across Slack/Teams/Email/PagerDuty, and draft Suspicious Activity Reports in FinCEN format.

Every agent extends a common `BaseAgent` class that enforces the OpenClaw lifecycle:

```typescript
/**
 * Lifecycle:
 *   onInit() → onHeartbeat() [periodic] → onSignal() [event-driven] → onShutdown()
 */
export abstract class BaseAgent {
  protected abstract onInit(): Promise<void>;
  protected abstract onHeartbeat(): Promise<void>;
  protected abstract onSignal(signal: NormalizedSignalEvent): Promise<void>;
  protected abstract onMessage(message: AgentMessage): Promise<void>;
  protected abstract onShutdown(): Promise<void>;
}
```

---

## Why Open-Source Matters for Compliance

Trust and compliance software should be inspectable. When a regulator asks "how does your monitoring system decide what to flag?" the answer should not be "it is proprietary." With RiskRadar:

- **Audit the algorithms.** Every detection pattern, every threshold, every fusion rule is in the source code.
- **Verify the AI reasoning.** The model router, the system prompts, the skill definitions — all visible.
- **Customize for your risk profile.** Fork it. Modify the detection skills. Add new collection agents. Adjust the thresholds.
- **No vendor lock-in.** Run Nemotron models locally, or use Claude/GPT via API. Switch anytime.

The open-source core includes the full agent system, the API, the dashboard, all 7 expert skills, and the 5 AI engines. Enterprise features (SSO/SAML, advanced analytics, white-glove deployment) are available separately.

---

## The Tech Stack

- **Runtime:** Node.js 20+, TypeScript (strict mode)
- **API:** Fastify 5 (8 route modules, RBAC, audit trails)
- **Agents:** OpenClaw agent service (12 agents, 7 expert skills, 5 AI engines)
- **Frontend:** Next.js 15 (11 dashboard pages)
- **Database:** PostgreSQL 16 + TimescaleDB (16 Prisma models, multi-tenant)
- **Queue:** BullMQ (10 queue types) on Redis 7
- **AI Models:** Nemotron-3-Super-120B, Nemotron-Cascade-2-30B, cloud fallback
- **Monorepo:** Turborepo + pnpm workspaces

---

## Get Started

### Self-hosted in 5 minutes:

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar/deploy/docker
cp .env.example .env        # Edit with your secrets
docker compose -f docker-compose.production.yml up -d
```

### With GPU (local AI inference):

```bash
docker compose -f docker-compose.production.yml --profile gpu up -d
```

### Development mode:

```bash
git clone https://github.com/smaan712gb/RiskRadar.git
cd RiskRadar
pnpm install
docker compose -f infrastructure/docker/docker-compose.yml up -d
pnpm db:generate && pnpm db:migrate dev --name init && pnpm db:seed
pnpm dev  # Starts API (3001), Web (3000), Agents
```

---

## What We Need From You

We are releasing RiskRadar because we believe the industry needs an open, inspectable, privacy-first alternative to the closed platforms that dominate risk monitoring today. But open-source only works with a community.

- **Star the repo:** [github.com/smaan712gb/RiskRadar](https://github.com/smaan712gb/RiskRadar)
- **Try it out:** Deploy locally and ingest your first signals
- **Open issues:** Found a bug? Have a feature idea? We want to hear it
- **Contribute:** PRs welcome — especially new collection agents and detection skills
- **Spread the word:** If you know a compliance officer, CISO, or risk analyst who is drowning in false positives, send them this post

We are building the future of risk intelligence in the open. Come build it with us.

---

*RiskRadar is built by [AIMADDS](https://aimadds.com) (AI Maan Advanced Digital Solutions). Apache 2.0 core. Enterprise features available for regulated industries.*

*Follow us: [GitHub](https://github.com/smaan712gb/RiskRadar) | [Twitter](https://twitter.com/risksradarai) | [LinkedIn](https://linkedin.com/company/aimadds)*
