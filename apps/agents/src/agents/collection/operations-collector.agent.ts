import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Operations Collector Agent
 *
 * Ingests operational and productivity data from project management,
 * CI/CD, and infrastructure monitoring systems.
 *
 * Data Sources:
 * - Jira/Linear (sprint velocity, ticket completion, backlog)
 * - GitHub/GitLab (commit frequency, PR patterns, code review metrics)
 * - PagerDuty/OpsGenie (on-call alert patterns, MTTR)
 * - CI/CD pipelines (build failures, deployment frequency)
 */
export class OperationsCollectorAgent extends BaseAgent {
  static createConfig(): AgentConfig {
    return {
      id: 'ops-collector',
      name: 'Operations Collector',
      team: 'collection',
      domain: 'operations',
      schedule: '10m',
      modelTier: 'tier1_super',
      dataSources: ['jira', 'github', 'pagerduty'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Operations Collector initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: this.context.tenantId, integrationType: 'operations', status: 'active' },
    });

    for (const integration of integrations) {
      await this.syncOpsData(integration);
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {}

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'force_sync') await this.onHeartbeat();
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Operations Collector shut down');
  }

  private async syncOpsData(integration: { id: string; provider: string; config: unknown; credentials: unknown }): Promise<void> {
    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const creds = integration.credentials as { token?: string; apiKey?: string };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (creds.token) headers['Authorization'] = `Bearer ${creds.token}`;
    if (creds.apiKey) headers['X-API-Key'] = creds.apiKey;

    try {
      // Sprint/Task metrics
      if (config.endpoints['tasks'] && integration.provider === 'jira') {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['tasks']}?updatedSince=${new Date(Date.now() - 15 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const data = (await response.json()) as { issues?: Array<Record<string, unknown>> };
          if (data.issues) await this.processTaskMetrics(data.issues);
        }
      }

      // Commit activity
      if (config.endpoints['commits'] && (integration.provider === 'github' || integration.provider === 'gitlab')) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['commits']}?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const commits = (await response.json()) as Array<Record<string, unknown>>;
          await this.processCommitActivity(commits);
        }
      }

      // Incident/Alert patterns
      if (config.endpoints['incidents'] && integration.provider === 'pagerduty') {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['incidents']}?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const incidents = (await response.json()) as Array<Record<string, unknown>>;
          await this.processIncidents(incidents);
        }
      }
    } catch (error) {
      this.logger.error({ error, provider: integration.provider }, 'Operations sync failed');
    }
  }

  private async processTaskMetrics(issues: Array<Record<string, unknown>>): Promise<void> {
    // Group by assignee to detect productivity changes
    const byAssignee = new Map<string, { completed: number; created: number; overdue: number }>();

    for (const issue of issues) {
      const assignee = String(issue['assigneeId'] ?? 'unassigned');
      const stats = byAssignee.get(assignee) ?? { completed: 0, created: 0, overdue: 0 };

      if (issue['status'] === 'done') stats.completed++;
      if (issue['status'] === 'created') stats.created++;
      if (issue['isOverdue'] === true) stats.overdue++;

      byAssignee.set(assignee, stats);
    }

    for (const [assigneeId, stats] of byAssignee) {
      if (assigneeId === 'unassigned') continue;

      // Flag if overdue tasks accumulating
      if (stats.overdue >= 5) {
        await this.emitOpsSignal('task_completion_drop', {
          userId: assigneeId,
          overdueCount: stats.overdue,
          completedCount: stats.completed,
          timestamp: new Date().toISOString(),
        }, stats.overdue);
      }
    }
  }

  private async processCommitActivity(commits: Array<Record<string, unknown>>): Promise<void> {
    // Group by author
    const byAuthor = new Map<string, number>();
    for (const commit of commits) {
      const author = String(commit['authorId'] ?? commit['author'] ?? 'unknown');
      byAuthor.set(author, (byAuthor.get(author) ?? 0) + 1);
    }

    // Compare against typical daily rate (would use digital twin baseline in production)
    for (const [authorId, count] of byAuthor) {
      // Unusually low activity might indicate disengagement
      if (count <= 1) {
        // Check if this person normally commits more - simplified check
        const recentSignals = await prisma.signal.count({
          where: {
            tenantId: this.context.tenantId,
            domain: 'operations',
            subjectId: authorId,
            signalType: 'productivity_decline',
            timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
          },
        });

        if (recentSignals >= 3) {
          await this.emitOpsSignal('productivity_decline', {
            userId: authorId,
            commitsToday: count,
            pattern: 'sustained_low_activity',
            timestamp: new Date().toISOString(),
          }, count);
        }
      }
    }
  }

  private async processIncidents(incidents: Array<Record<string, unknown>>): Promise<void> {
    for (const incident of incidents) {
      const severity = String(incident['severity'] ?? 'low');
      if (severity === 'critical' || severity === 'high') {
        await this.emitOpsSignal('system_anomaly', {
          incidentId: incident['id'],
          title: incident['title'],
          severity,
          service: incident['service'],
          timestamp: incident['createdAt'],
        }, null);
      }
    }
  }

  private async emitOpsSignal(signalType: string, data: Record<string, unknown>, value: number | null): Promise<void> {
    const signal: NormalizedSignalEvent = {
      signalId: `ops_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tenantId: this.context.tenantId,
      domain: 'operations',
      signalType: signalType as any,
      subjectType: data['service'] ? 'system' : 'employee',
      subjectId: String(data['userId'] ?? data['service'] ?? 'unknown'),
      sourceSystem: 'operations',
      value,
      metadata: { ...data, role: data['role'] },
      timestamp: new Date(String(data['timestamp'] ?? Date.now())),
    };

    await prisma.signal.create({
      data: {
        tenantId: signal.tenantId, domain: signal.domain, signalType: signal.signalType,
        subjectType: signal.subjectType, subjectId: signal.subjectId, sourceSystem: signal.sourceSystem,
        value: signal.value, metadata: signal.metadata as any, timestamp: signal.timestamp, normalizedAt: new Date(),
      },
    });

    await this.emitSignal(signal);
  }
}
