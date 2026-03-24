import { getRedisConnection } from '@riskradar/queue';
import { createLogger } from '@riskradar/logger';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import type { AgentMessage } from './event-schemas.js';

const logger = createLogger('agent-bus');

type MessageHandler = (message: AgentMessage) => void;

/**
 * Agent-to-agent message bus using Redis Pub/Sub.
 * Provides typed, channel-based communication between agents.
 */
export class AgentBus {
  private handlers = new Map<string, MessageHandler[]>();
  private subscriber;
  private publisher;

  constructor() {
    const redis = getRedisConnection();
    this.publisher = redis.duplicate();
    this.subscriber = redis.duplicate();

    this.subscriber.on('message', (channel: string, message: string) => {
      this.handleIncoming(channel, message);
    });
  }

  async initialize(): Promise<void> {
    // Subscribe to global signal channel
    await this.subscriber.subscribe('riskradar:signals');
    logger.info('Agent bus initialized');
  }

  subscribe(agentId: string, handler: MessageHandler): void {
    const channel = `riskradar:agent:${agentId}`;
    const existing = this.handlers.get(channel) ?? [];
    existing.push(handler);
    this.handlers.set(channel, existing);
    this.subscriber.subscribe(channel);
    logger.debug({ agentId, channel }, 'Agent subscribed');
  }

  unsubscribe(agentId: string): void {
    const channel = `riskradar:agent:${agentId}`;
    this.handlers.delete(channel);
    this.subscriber.unsubscribe(channel);
  }

  async send(message: AgentMessage): Promise<void> {
    const channel = `riskradar:agent:${message.toAgentId}`;
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async broadcastToTeam(team: string, message: AgentMessage): Promise<void> {
    const channel = `riskradar:team:${team}`;
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  subscribeToTeam(team: string, handler: MessageHandler): void {
    const channel = `riskradar:team:${team}`;
    const existing = this.handlers.get(channel) ?? [];
    existing.push(handler);
    this.handlers.set(channel, existing);
    this.subscriber.subscribe(channel);
  }

  async publishSignal(signal: NormalizedSignalEvent): Promise<void> {
    await this.publisher.publish('riskradar:signals', JSON.stringify(signal));
  }

  subscribeToSignals(handler: (signal: NormalizedSignalEvent) => void): void {
    const existing = this.handlers.get('riskradar:signals') ?? [];
    existing.push((msg) => handler(msg as unknown as NormalizedSignalEvent));
    this.handlers.set('riskradar:signals', existing);
  }

  async shutdown(): Promise<void> {
    await this.subscriber.quit();
    await this.publisher.quit();
    logger.info('Agent bus shut down');
  }

  private handleIncoming(channel: string, rawMessage: string): void {
    try {
      const message = JSON.parse(rawMessage) as AgentMessage;
      const handlers = this.handlers.get(channel) ?? [];

      for (const handler of handlers) {
        try {
          handler(message);
        } catch (error) {
          logger.error({ error, channel }, 'Handler error');
        }
      }
    } catch (error) {
      logger.error({ error, channel }, 'Failed to parse message');
    }
  }
}

export type { AgentMessage };
