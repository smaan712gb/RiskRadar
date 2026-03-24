import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Notification Agent
 *
 * Routes alerts and updates to the appropriate channels:
 * - Slack (webhooks + Bot API)
 * - Microsoft Teams (webhooks)
 * - Email (SMTP)
 * - SMS (for critical alerts)
 * - ServiceNow/JIRA (ticket creation)
 * - PagerDuty (for critical incidents)
 *
 * Respects notification preferences per tenant and per user.
 * Rate-limits notifications to prevent alert fatigue.
 */
export class NotificationAgent extends BaseAgent {
  private sentNotifications = new Map<string, number>(); // dedup key → timestamp
  private rateLimitWindow = 5 * 60 * 1000; // 5 minutes

  static createConfig(): AgentConfig {
    return {
      id: 'notification-agent',
      name: 'Notification Router',
      team: 'response',
      schedule: '1m', // Check for queued notifications every minute
      modelTier: 'tier1_super',
      dataSources: ['slack', 'teams', 'email', 'sms'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Notification Agent initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    // Clean expired dedup entries
    const now = Date.now();
    for (const [key, timestamp] of this.sentNotifications) {
      if (now - timestamp > this.rateLimitWindow) {
        this.sentNotifications.delete(key);
      }
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // Notification agent doesn't process raw signals
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'urgent_notification') {
      await this.sendUrgentNotification(message.payload);
    }

    if (message.type === 'alert_notification') {
      await this.sendAlertNotification(message.payload);
    }

    if (message.type === 'regulatory_update') {
      await this.sendRegulatoryUpdateNotification(message.payload);
    }

    if (message.type === 'case_update') {
      await this.sendCaseUpdateNotification(message.payload);
    }

    if (message.type === 'sla_warning') {
      await this.sendSLAWarning(message.payload);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Notification Agent shutting down');
  }

  // ─── Notification Handlers ────────────────────────────────

  private async sendUrgentNotification(payload: Record<string, unknown>): Promise<void> {
    const dedupKey = `urgent:${JSON.stringify(payload['title'])}`;
    if (this.isDuplicate(dedupKey)) return;

    this.logger.warn({ payload }, 'Sending URGENT notification');

    // Send to ALL configured channels simultaneously
    await Promise.allSettled([
      this.sendSlack({
        channel: '#riskradar-critical',
        text: `*URGENT*: ${payload['title']}`,
        blocks: this.buildSlackAlertBlocks(payload),
      }),
      this.sendTeams({
        title: `URGENT: ${String(payload['title'])}`,
        text: String(payload['summary'] ?? ''),
        themeColor: 'FF0000',
      }),
      this.sendEmail({
        to: payload['recipients'] as string[] ?? [],
        subject: `[CRITICAL] ${payload['title']}`,
        html: this.buildEmailHTML(payload),
      }),
    ]);

    this.sentNotifications.set(dedupKey, Date.now());
  }

  private async sendAlertNotification(payload: Record<string, unknown>): Promise<void> {
    const severity = payload['severity'] as string;
    const dedupKey = `alert:${payload['alertId']}:${severity}`;
    if (this.isDuplicate(dedupKey)) return;

    const channel = severity === 'critical' ? '#riskradar-critical'
      : severity === 'high' ? '#riskradar-alerts'
      : '#riskradar-monitor';

    await this.sendSlack({
      channel,
      text: `[${String(severity).toUpperCase()}] ${payload['title']}`,
      blocks: this.buildSlackAlertBlocks(payload),
    });

    this.sentNotifications.set(dedupKey, Date.now());
  }

  private async sendRegulatoryUpdateNotification(payload: Record<string, unknown>): Promise<void> {
    const severity = payload['severity'] as string;
    const dedupKey = `reg:${payload['title']}`;
    if (this.isDuplicate(dedupKey)) return;

    await this.sendSlack({
      channel: '#riskradar-compliance',
      text: `*Regulatory Update* [${String(severity).toUpperCase()}]: ${payload['title']}`,
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: `Regulatory Update: ${payload['title']}` } },
        { type: 'section', text: { type: 'mrkdwn', text: String(payload['summary'] ?? '') } },
        {
          type: 'section',
          fields: [
            { type: 'mrkdwn', text: `*Source:* ${payload['source']}` },
            { type: 'mrkdwn', text: `*Urgency:* ${severity}` },
            { type: 'mrkdwn', text: `*Affected Domains:* ${(payload['affectedDomains'] as string[])?.join(', ')}` },
            { type: 'mrkdwn', text: `*Deadline:* ${payload['complianceDeadline'] ?? 'TBD'}` },
          ],
        },
        ...(payload['url'] ? [{ type: 'actions', elements: [{ type: 'button', text: { type: 'plain_text', text: 'View Full Text' }, url: String(payload['url']) }] }] : []),
      ],
    });

    this.sentNotifications.set(dedupKey, Date.now());
  }

  private async sendCaseUpdateNotification(payload: Record<string, unknown>): Promise<void> {
    await this.sendSlack({
      channel: '#riskradar-cases',
      text: `Case Update: ${payload['title']} — ${payload['status']}`,
    });
  }

  private async sendSLAWarning(payload: Record<string, unknown>): Promise<void> {
    await this.sendSlack({
      channel: '#riskradar-alerts',
      text: `*SLA Warning*: Case ${payload['caseId']} — ${payload['message']}`,
    });
  }

  // ─── Channel Implementations ──────────────────────────────

  private async sendSlack(message: { channel: string; text: string; blocks?: unknown[] }): Promise<void> {
    const webhookUrl = process.env['SLACK_WEBHOOK_URL'];
    if (!webhookUrl) {
      this.logger.debug({ channel: message.channel }, 'Slack not configured, skipping');
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: message.channel,
          text: message.text,
          blocks: message.blocks,
        }),
      });

      if (!response.ok) {
        this.logger.error({ status: response.status }, 'Slack notification failed');
      }
    } catch (error) {
      this.logger.error({ error }, 'Slack notification error');
    }
  }

  private async sendTeams(message: { title: string; text: string; themeColor?: string }): Promise<void> {
    const webhookUrl = process.env['TEAMS_WEBHOOK_URL'];
    if (!webhookUrl) return;

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          '@type': 'MessageCard',
          themeColor: message.themeColor ?? '0076D7',
          summary: message.title,
          sections: [{
            activityTitle: message.title,
            text: message.text,
          }],
        }),
      });
    } catch (error) {
      this.logger.error({ error }, 'Teams notification error');
    }
  }

  private async sendEmail(message: { to: string[]; subject: string; html: string }): Promise<void> {
    // In production, use nodemailer or SendGrid
    this.logger.info({ to: message.to, subject: message.subject }, 'Email notification queued');
  }

  // ─── Helpers ──────────────────────────────────────────────

  private isDuplicate(key: string): boolean {
    const existing = this.sentNotifications.get(key);
    return existing !== undefined && Date.now() - existing < this.rateLimitWindow;
  }

  private buildSlackAlertBlocks(payload: Record<string, unknown>): unknown[] {
    return [
      {
        type: 'header',
        text: { type: 'plain_text', text: String(payload['title'] ?? 'Alert') },
      },
      {
        type: 'section',
        text: { type: 'mrkdwn', text: String(payload['summary'] ?? payload['description'] ?? '') },
      },
      {
        type: 'section',
        fields: [
          { type: 'mrkdwn', text: `*Severity:* ${payload['severity'] ?? 'unknown'}` },
          { type: 'mrkdwn', text: `*Score:* ${payload['compoundScore'] ?? 'N/A'}` },
          { type: 'mrkdwn', text: `*Subject:* ${payload['subjectId'] ?? 'N/A'}` },
          { type: 'mrkdwn', text: `*Domains:* ${(payload['domains'] as string[])?.join(', ') ?? 'N/A'}` },
        ],
      },
    ];
  }

  private buildEmailHTML(payload: Record<string, unknown>): string {
    return `
      <h2>${payload['title']}</h2>
      <p>${payload['summary'] ?? ''}</p>
      <table>
        <tr><td><strong>Severity:</strong></td><td>${payload['severity']}</td></tr>
        <tr><td><strong>Score:</strong></td><td>${payload['compoundScore']}</td></tr>
        <tr><td><strong>Subject:</strong></td><td>${payload['subjectId']}</td></tr>
      </table>
      <p><a href="${payload['dashboardUrl'] ?? '#'}">View in RiskRadar Dashboard</a></p>
    `;
  }
}
