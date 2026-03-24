import { createLogger, type Logger } from '@riskradar/logger';
import type { NormalizedSignalEvent, RiskDomainType } from '@riskradar/shared';
import { type ModelRouter } from '../lib/model-router.js';
import { type AgentBus, type AgentMessage } from '../messaging/agent-bus.js';

export interface AgentConfig {
  id: string;
  name: string;
  team: 'collection' | 'analysis' | 'response';
  domain?: RiskDomainType;
  schedule?: string; // Cron expression for heartbeat
  modelTier: 'tier1_super' | 'tier2_cascade';
  dataSources: string[];
  enabled: boolean;
}

export interface AgentContext {
  tenantId: string;
  config: AgentConfig;
  modelRouter: ModelRouter;
  messageBus: AgentBus;
  logger: Logger;
}

export type AgentStatus = 'initializing' | 'running' | 'idle' | 'processing' | 'error' | 'stopped';

/**
 * Base class for all RiskRadar monitoring agents.
 *
 * Lifecycle:
 *   onInit() → onHeartbeat() [periodic] → onSignal() [event-driven] → onShutdown()
 *
 * Subclasses implement domain-specific logic:
 *   - Collection agents: ingest data from enterprise systems
 *   - Analysis agents: correlate signals, detect patterns, reason
 *   - Response agents: route alerts, draft SARs, send notifications
 */
export abstract class BaseAgent {
  protected context: AgentContext;
  protected logger: Logger;
  protected status: AgentStatus = 'initializing';
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  constructor(context: AgentContext) {
    this.context = context;
    this.logger = createLogger(`agent:${context.config.name}`, {
      agentId: context.config.id,
      team: context.config.team,
      domain: context.config.domain,
    });
  }

  // ─── Lifecycle Methods (override in subclasses) ────────────

  /** Called once when the agent starts. Setup connections, load state. */
  protected abstract onInit(): Promise<void>;

  /** Called periodically (cron schedule). Pull data, check conditions. */
  protected abstract onHeartbeat(): Promise<void>;

  /** Called when the agent receives a signal event from another agent or data source. */
  protected abstract onSignal(signal: NormalizedSignalEvent): Promise<void>;

  /** Called when the agent receives a message from another agent. */
  protected abstract onMessage(message: AgentMessage): Promise<void>;

  /** Called when the agent is shutting down. Cleanup resources. */
  protected abstract onShutdown(): Promise<void>;

  // ─── Public API ────────────────────────────────────────────

  async start(): Promise<void> {
    this.logger.info('Starting agent');
    this.status = 'initializing';

    try {
      await this.onInit();
      this.status = 'running';

      // Subscribe to messages for this agent
      this.context.messageBus.subscribe(this.context.config.id, (message) => {
        this.handleMessage(message);
      });

      // Start heartbeat if schedule is defined
      if (this.context.config.schedule) {
        this.startHeartbeat();
      }

      this.logger.info('Agent started successfully');
    } catch (error) {
      this.status = 'error';
      this.logger.error({ error }, 'Failed to start agent');
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping agent');
    this.status = 'stopped';

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    this.context.messageBus.unsubscribe(this.context.config.id);
    await this.onShutdown();
    this.logger.info('Agent stopped');
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getConfig(): AgentConfig {
    return this.context.config;
  }

  // ─── Protected Helpers ────────────────────────────────────

  /** Emit a normalized signal for other agents to consume. */
  protected async emitSignal(signal: NormalizedSignalEvent): Promise<void> {
    await this.context.messageBus.publishSignal(signal);
  }

  /** Send a message to another agent by ID. */
  protected async sendMessage(
    targetAgentId: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.context.messageBus.send({
      fromAgentId: this.context.config.id,
      toAgentId: targetAgentId,
      type,
      payload,
      timestamp: new Date(),
    });
  }

  /** Broadcast a message to all agents in a team. */
  protected async broadcastToTeam(
    team: string,
    type: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    await this.context.messageBus.broadcastToTeam(team, {
      fromAgentId: this.context.config.id,
      toAgentId: '*',
      type,
      payload,
      timestamp: new Date(),
    });
  }

  /** Run inference through the model router. */
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

  // ─── Private ──────────────────────────────────────────────

  private startHeartbeat(): void {
    // Parse simple interval (e.g., "5m", "1h", "30s")
    const intervalMs = this.parseInterval(this.context.config.schedule ?? '5m');

    this.heartbeatInterval = setInterval(async () => {
      if (this.status !== 'running' && this.status !== 'idle') return;

      try {
        this.status = 'processing';
        await this.onHeartbeat();
        this.status = 'idle';
      } catch (error) {
        this.logger.error({ error }, 'Heartbeat failed');
        this.status = 'error';
      }
    }, intervalMs);

    this.logger.info({ intervalMs }, 'Heartbeat started');
  }

  private async handleMessage(message: AgentMessage): Promise<void> {
    try {
      this.status = 'processing';
      await this.onMessage(message);
      this.status = this.heartbeatInterval ? 'idle' : 'running';
    } catch (error) {
      this.logger.error({ error, message }, 'Failed to handle message');
    }
  }

  private parseInterval(schedule: string): number {
    const match = schedule.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 5 * 60 * 1000; // default 5 min

    const value = parseInt(match[1]!, 10);
    const unit = match[2]!;

    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return value * (multipliers[unit] ?? 60 * 1000);
  }
}
