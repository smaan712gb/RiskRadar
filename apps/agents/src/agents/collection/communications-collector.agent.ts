import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Communications Collector Agent
 *
 * Ingests communication METADATA (never content) from collaboration platforms.
 * Applies Communications Intelligence skill for network analysis.
 *
 * PRIVACY: Analyzes metadata only — frequency, timing, response latency,
 * sender/recipient patterns. NEVER reads message content.
 *
 * Data Sources:
 * - Microsoft 365 Graph API (email metadata, calendar, Teams activity)
 * - Slack Events API (channel activity metadata, response times)
 * - Google Workspace Admin SDK (activity reports, login events)
 */
export class CommunicationsCollectorAgent extends BaseAgent {
  static createConfig(): AgentConfig {
    return {
      id: 'comms-collector',
      name: 'Communications Collector',
      team: 'collection',
      domain: 'communications',
      schedule: '15m',
      modelTier: 'tier1_super',
      dataSources: ['microsoft365', 'slack', 'google_workspace'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Communications Collector initialized (METADATA ONLY)');
  }

  protected async onHeartbeat(): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: this.context.tenantId, integrationType: 'communication', status: 'active' },
    });

    for (const integration of integrations) {
      await this.syncCommunicationMetadata(integration);
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {}

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'force_sync') await this.onHeartbeat();
    if (message.type === 'analyze_communication_pattern') {
      await this.analyzePattern(message.payload['subjectId'] as string);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Communications Collector shut down');
  }

  private async syncCommunicationMetadata(integration: { id: string; provider: string; config: unknown; credentials: unknown }): Promise<void> {
    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const creds = integration.credentials as { token?: string };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(creds.token && { Authorization: `Bearer ${creds.token}` }),
    };

    try {
      // Email metadata (frequency, response times — NOT content)
      if (config.endpoints['email_metadata']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['email_metadata']}?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&fields=from,to,timestamp,responseTime`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const data = (await response.json()) as Array<Record<string, unknown>>;
          await this.processEmailMetadata(data);
        }
      }

      // Meeting patterns
      if (config.endpoints['calendar_metadata']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['calendar_metadata']}?since=${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}&fields=organizer,attendees,duration,responseStatus`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const data = (await response.json()) as Array<Record<string, unknown>>;
          await this.processMeetingMetadata(data);
        }
      }

      // Chat activity metadata
      if (config.endpoints['chat_activity']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['chat_activity']}?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}&fields=userId,channelCount,messageCount,responseTime`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const data = (await response.json()) as Array<Record<string, unknown>>;
          await this.processChatActivity(data);
        }
      }
    } catch (error) {
      this.logger.error({ error, provider: integration.provider }, 'Communication metadata sync failed');
    }
  }

  private async processEmailMetadata(records: Array<Record<string, unknown>>): Promise<void> {
    // Group by user to calculate daily email metrics
    const byUser = new Map<string, { sent: number; received: number; avgResponseMinutes: number; responseTimes: number[] }>();

    for (const record of records) {
      const userId = String(record['from'] ?? record['userId'] ?? 'unknown');
      const stats = byUser.get(userId) ?? { sent: 0, received: 0, avgResponseMinutes: 0, responseTimes: [] };
      stats.sent++;
      if (record['responseTimeMinutes']) {
        stats.responseTimes.push(Number(record['responseTimeMinutes']));
      }
      byUser.set(userId, stats);
    }

    for (const [userId, stats] of byUser) {
      const avgResponse = stats.responseTimes.length > 0
        ? stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length
        : null;

      // Compare against expected baseline (would use digital twin in production)
      // Flag if response time significantly increased
      if (avgResponse && avgResponse > 120) { // > 2 hours avg response
        await this.emitCommsSignal('response_time_increase', {
          userId,
          avgResponseMinutes: Math.round(avgResponse),
          emailsSent: stats.sent,
          timestamp: new Date().toISOString(),
        }, avgResponse);
      }

      // Flag low email volume (potential disengagement)
      if (stats.sent < 3) { // Very low daily email activity
        await this.emitCommsSignal('communication_drop', {
          userId,
          emailsSent: stats.sent,
          pattern: 'low_daily_volume',
          timestamp: new Date().toISOString(),
        }, stats.sent);
      }
    }
  }

  private async processMeetingMetadata(records: Array<Record<string, unknown>>): Promise<void> {
    const byUser = new Map<string, { meetings: number; totalMinutes: number; declined: number }>();

    for (const record of records) {
      const attendees = (record['attendees'] as Array<Record<string, unknown>>) ?? [];
      for (const attendee of attendees) {
        const userId = String(attendee['userId'] ?? attendee['email'] ?? 'unknown');
        const stats = byUser.get(userId) ?? { meetings: 0, totalMinutes: 0, declined: 0 };
        stats.meetings++;
        stats.totalMinutes += Number(record['durationMinutes'] ?? 30);
        if (attendee['responseStatus'] === 'declined') stats.declined++;
        byUser.set(userId, stats);
      }
    }

    for (const [userId, stats] of byUser) {
      const weeklyHours = stats.totalMinutes / 60;

      // Flag meeting overload (>30h/week = burnout indicator)
      if (weeklyHours > 30) {
        await this.emitCommsSignal('meeting_pattern_change', {
          userId,
          weeklyMeetingHours: Math.round(weeklyHours * 10) / 10,
          meetingCount: stats.meetings,
          pattern: 'overload',
          timestamp: new Date().toISOString(),
        }, weeklyHours);
      }

      // Flag high decline rate (disengagement indicator)
      if (stats.declined > stats.meetings * 0.3 && stats.meetings >= 5) {
        await this.emitCommsSignal('meeting_pattern_change', {
          userId,
          declineRate: Math.round((stats.declined / stats.meetings) * 100),
          pattern: 'high_decline_rate',
          timestamp: new Date().toISOString(),
        }, stats.declined);
      }
    }
  }

  private async processChatActivity(records: Array<Record<string, unknown>>): Promise<void> {
    for (const record of records) {
      const messageCount = Number(record['messageCount'] ?? 0);
      const channelCount = Number(record['channelCount'] ?? 0);
      const responseTime = Number(record['avgResponseTimeMinutes'] ?? 0);

      // Flag significant drops in chat activity
      if (messageCount < 5 && channelCount < 2) {
        await this.emitCommsSignal('communication_drop', {
          userId: String(record['userId']),
          messageCount,
          channelCount,
          pattern: 'chat_withdrawal',
          timestamp: new Date().toISOString(),
        }, messageCount);
      }

      // Flag slow response times
      if (responseTime > 60) { // > 1 hour avg chat response
        await this.emitCommsSignal('response_time_increase', {
          userId: String(record['userId']),
          avgResponseMinutes: responseTime,
          channel: 'chat',
          timestamp: new Date().toISOString(),
        }, responseTime);
      }
    }
  }

  private async emitCommsSignal(signalType: string, data: Record<string, unknown>, value: number | null): Promise<void> {
    const signal: NormalizedSignalEvent = {
      signalId: `comms_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tenantId: this.context.tenantId,
      domain: 'communications',
      signalType: signalType as any,
      subjectType: 'employee',
      subjectId: String(data['userId'] ?? 'unknown'),
      sourceSystem: 'communications_metadata',
      value,
      metadata: { ...data, role: data['role'] },
      timestamp: new Date(String(data['timestamp'] ?? Date.now())),
    };

    await prisma.signal.create({
      data: {
        tenantId: signal.tenantId, domain: signal.domain, signalType: signal.signalType,
        subjectType: signal.subjectType, subjectId: signal.subjectId, sourceSystem: signal.sourceSystem,
        value: signal.value, metadata: signal.metadata, timestamp: signal.timestamp, normalizedAt: new Date(),
      },
    });

    await this.emitSignal(signal);
  }

  private async analyzePattern(subjectId: string): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: { tenantId: this.context.tenantId, domain: 'communications', subjectId, timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      orderBy: { timestamp: 'asc' },
    });

    if (signals.length < 5) return;

    const analysis = await this.reason(
      `Analyze communication patterns for ${subjectId} using Communications Intelligence skill.\n\nSignals (${signals.length}):\n${signals.map((s) => `[${s.timestamp.toISOString()}] ${s.signalType}: value=${s.value}`).join('\n')}\n\nAssess: withdrawal patterns, isolation drift, temporal shifts, responsiveness decay. Use network analysis methods where applicable.`,
      'You are using the Communications Intelligence Expert skill. Analyze METADATA ONLY — never content.',
      { requireReasoning: true },
    );

    await this.sendMessage('fusion-agent', 'communication_analysis_complete', {
      subjectId, analysis: analysis.content, reasoning: analysis.reasoning,
    });
  }
}
