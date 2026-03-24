import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Security Collector Agent
 *
 * Ingests security data from SIEM, IAM, endpoint, and network monitoring systems.
 * Applies Insider Threat Detection skill for CERT/CC-level analysis.
 *
 * Data Sources:
 * - Splunk/QRadar (SIEM events, security alerts)
 * - Azure AD/Okta (authentication events, MFA status, role changes)
 * - CrowdStrike/Defender (endpoint detection events)
 * - Network monitoring (traffic anomalies, unauthorized connections)
 * - DLP systems (data transfer events)
 */
export class SecurityCollectorAgent extends BaseAgent {
  static createConfig(): AgentConfig {
    return {
      id: 'security-collector',
      name: 'Security Collector',
      team: 'collection',
      domain: 'security',
      schedule: '2m',
      modelTier: 'tier1_super',
      dataSources: ['splunk', 'azure_ad', 'okta', 'crowdstrike'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Security Collector initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: this.context.tenantId, integrationType: 'siem_security', status: 'active' },
    });

    for (const integration of integrations) {
      await this.syncSIEM(integration);
    }

    const iamIntegrations = await prisma.integration.findMany({
      where: { tenantId: this.context.tenantId, integrationType: 'iam', status: 'active' },
    });

    for (const integration of iamIntegrations) {
      await this.syncIAM(integration);
    }
  }

  protected async onSignal(signal: NormalizedSignalEvent): Promise<void> {
    // Cross-domain: if finance override detected, check for related security events
    if (signal.domain === 'finance' && signal.signalType === 'override_transaction') {
      await this.checkSecurityCorrelation(signal.subjectId);
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'force_sync') await this.onHeartbeat();
    if (message.type === 'investigate_subject') {
      await this.deepSecurityAnalysis(message.payload['subjectId'] as string);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Security Collector shut down');
  }

  private async syncSIEM(integration: { id: string; provider: string; config: unknown; credentials: unknown }): Promise<void> {
    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const creds = integration.credentials as { token?: string; apiKey?: string };

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (creds.token) headers['Authorization'] = `Bearer ${creds.token}`;
      if (creds.apiKey) headers['X-API-Key'] = creds.apiKey;

      // Fetch failed login events
      if (config.endpoints['failed_logins']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['failed_logins']}?since=${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const events = (await response.json()) as Array<Record<string, unknown>>;
          await this.processLoginEvents(events);
        }
      }

      // Fetch privilege escalation events
      if (config.endpoints['privilege_changes']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['privilege_changes']}?since=${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const events = (await response.json()) as Array<Record<string, unknown>>;
          await this.processPrivilegeEvents(events);
        }
      }

      // Fetch data transfer events
      if (config.endpoints['data_transfers']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['data_transfers']}?since=${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const events = (await response.json()) as Array<Record<string, unknown>>;
          await this.processDataTransfers(events);
        }
      }
    } catch (error) {
      this.logger.error({ error, provider: integration.provider }, 'SIEM sync failed');
    }
  }

  private async syncIAM(integration: { id: string; provider: string; config: unknown; credentials: unknown }): Promise<void> {
    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const creds = integration.credentials as { token?: string };

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(creds.token && { Authorization: `Bearer ${creds.token}` }),
      };

      // Fetch sign-in logs
      if (config.endpoints['sign_ins']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['sign_ins']}?since=${new Date(Date.now() - 5 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const events = (await response.json()) as Array<Record<string, unknown>>;
          for (const event of events) {
            const hour = new Date(String(event['timestamp'])).getHours();
            const isAfterHours = hour < 7 || hour > 19;
            const isMFABypassed = event['mfaStatus'] === 'bypassed' || event['mfaStatus'] === 'not_required';

            if (isAfterHours || isMFABypassed || event['riskLevel'] === 'high') {
              const signalType = isAfterHours ? 'after_hours_access' : isMFABypassed ? 'mfa_bypass' : 'unusual_data_access';
              await this.emitSecuritySignal(signalType, event);
            }
          }
        }
      }
    } catch (error) {
      this.logger.error({ error, provider: integration.provider }, 'IAM sync failed');
    }
  }

  private async processLoginEvents(events: Array<Record<string, unknown>>): Promise<void> {
    // Group by user to detect spikes
    const byUser = new Map<string, number>();
    for (const event of events) {
      if (event['status'] === 'failed') {
        const userId = String(event['userId'] ?? 'unknown');
        byUser.set(userId, (byUser.get(userId) ?? 0) + 1);
      }
    }

    for (const [userId, count] of byUser) {
      if (count >= 5) {
        await this.emitSecuritySignal('failed_login_spike', {
          userId,
          failedCount: count,
          timeWindow: '5 minutes',
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  private async processPrivilegeEvents(events: Array<Record<string, unknown>>): Promise<void> {
    for (const event of events) {
      if (event['changeType'] === 'elevation' || event['changeType'] === 'role_added') {
        await this.emitSecuritySignal('privilege_escalation', event);
      }
    }
  }

  private async processDataTransfers(events: Array<Record<string, unknown>>): Promise<void> {
    for (const event of events) {
      const sizeMb = Number(event['sizeMb'] ?? 0);
      const destination = String(event['destination'] ?? '');
      const isExternal = destination.includes('personal') || destination.includes('dropbox') || destination.includes('gdrive');

      if (sizeMb > 100 || isExternal) {
        await this.emitSecuritySignal('data_exfiltration', {
          ...event,
          isExternal,
          sizeMb,
        });
      }
    }
  }

  private async emitSecuritySignal(signalType: string, event: Record<string, unknown>): Promise<void> {
    const signal: NormalizedSignalEvent = {
      signalId: `sec_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tenantId: this.context.tenantId,
      domain: 'security',
      signalType: signalType as any,
      subjectType: 'employee',
      subjectId: String(event['userId'] ?? event['subjectId'] ?? 'unknown'),
      sourceSystem: String(event['source'] ?? 'siem'),
      value: Number(event['riskScore'] ?? event['sizeMb'] ?? event['failedCount'] ?? null),
      metadata: { ...event, role: event['role'] },
      timestamp: new Date(String(event['timestamp'] ?? Date.now())),
    };

    await prisma.signal.create({
      data: {
        tenantId: signal.tenantId,
        domain: signal.domain,
        signalType: signal.signalType,
        subjectType: signal.subjectType,
        subjectId: signal.subjectId,
        sourceSystem: signal.sourceSystem,
        value: signal.value,
        metadata: signal.metadata,
        timestamp: signal.timestamp,
        normalizedAt: new Date(),
      },
    });

    await this.emitSignal(signal);
  }

  private async checkSecurityCorrelation(subjectId: string): Promise<void> {
    const recentSecuritySignals = await prisma.signal.findMany({
      where: {
        tenantId: this.context.tenantId,
        domain: 'security',
        subjectId,
        timestamp: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (recentSecuritySignals.length > 0) {
      this.logger.info({ subjectId, count: recentSecuritySignals.length }, 'Security-finance correlation detected');
      await this.sendMessage('fusion-agent', 'cross_domain_correlation', {
        subjectId,
        domains: ['finance', 'security'],
        signals: recentSecuritySignals.map((s) => ({ type: s.signalType, timestamp: s.timestamp.toISOString() })),
      });
    }
  }

  private async deepSecurityAnalysis(subjectId: string): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: { tenantId: this.context.tenantId, domain: 'security', subjectId, timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      orderBy: { timestamp: 'asc' },
    });

    if (signals.length < 2) return;

    const analysis = await this.reason(
      `Analyze these security signals for subject ${subjectId} using the Insider Threat Detection skill:\n${signals.map((s, i) => `${i + 1}. [${s.timestamp.toISOString()}] ${s.signalType}: value=${s.value}, source=${s.sourceSystem}`).join('\n')}\n\nClassify by kill chain stage, apply MITRE ATT&CK mapping, and calculate weighted risk score.`,
      'You are using the Insider Threat Detection Expert skill. Apply CERT/CC and MITRE ATT&CK-level analysis.',
      { requireReasoning: true },
    );

    await this.sendMessage('reasoning-agent', 'analysis_complete', {
      subjectId, domain: 'security', signalCount: signals.length,
      analysis: analysis.content, reasoning: analysis.reasoning,
    });
  }
}
