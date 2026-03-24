import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * HR Collector Agent
 *
 * Ingests workforce data from HRIS, time/attendance, and training systems.
 * Applies Workforce Behavioral Analytics skill for I/O Psychology-level analysis.
 *
 * Data Sources:
 * - Workday/SuccessFactors/BambooHR (employee records, performance, leave)
 * - Time & Attendance (badge swipes, clock in/out)
 * - Training/LMS (completion rates, certifications)
 * - Payroll (direct deposit changes, compensation)
 */
export class HRCollectorAgent extends BaseAgent {
  static createConfig(): AgentConfig {
    return {
      id: 'hr-collector',
      name: 'HR Collector',
      team: 'collection',
      domain: 'hr',
      schedule: '15m',
      modelTier: 'tier1_super',
      dataSources: ['workday', 'successfactors', 'bamboohr', 'adp'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('HR Collector initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    const integrations = await prisma.integration.findMany({
      where: { tenantId: this.context.tenantId, integrationType: 'hris', status: 'active' },
    });

    for (const integration of integrations) {
      await this.syncHRIS(integration);
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // Cross-domain: communication drops may indicate HR issues
    if (_signal.domain === 'communications' && _signal.signalType === 'communication_drop') {
      await this.enrichWithHRContext(_signal.subjectId);
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'force_sync') await this.onHeartbeat();
    if (message.type === 'assess_flight_risk') {
      await this.assessFlightRisk(message.payload['subjectId'] as string);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('HR Collector shut down');
  }

  private async syncHRIS(integration: { id: string; provider: string; config: unknown; credentials: unknown }): Promise<void> {
    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const creds = integration.credentials as { token?: string; apiKey?: string };

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (creds.token) headers['Authorization'] = `Bearer ${creds.token}`;

    try {
      // Attendance anomalies
      if (config.endpoints['attendance']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['attendance']}?since=${new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const records = (await response.json()) as Array<Record<string, unknown>>;
          await this.processAttendance(records);
        }
      }

      // Training completion
      if (config.endpoints['training']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['training']}?status=overdue`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const records = (await response.json()) as Array<Record<string, unknown>>;
          await this.processTrainingOverdue(records);
        }
      }

      // Performance data
      if (config.endpoints['performance']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['performance']}?period=current`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const records = (await response.json()) as Array<Record<string, unknown>>;
          await this.processPerformanceData(records);
        }
      }

      // Leave patterns
      if (config.endpoints['leave']) {
        const response = await fetch(
          `${config.baseUrl}${config.endpoints['leave']}?since=${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}`,
          { headers, signal: AbortSignal.timeout(10000) },
        );
        if (response.ok) {
          const records = (await response.json()) as Array<Record<string, unknown>>;
          await this.processLeavePatterns(records);
        }
      }
    } catch (error) {
      this.logger.error({ error, provider: integration.provider }, 'HRIS sync failed');
    }
  }

  private async processAttendance(records: Array<Record<string, unknown>>): Promise<void> {
    for (const record of records) {
      const sickDaysThisMonth = Number(record['sickDaysThisMonth'] ?? 0);
      const lateArrivals = Number(record['lateArrivalsThisWeek'] ?? 0);
      const noBadgeSwipe = record['noBadgeSwipe'] === true;

      if (sickDaysThisMonth >= 3 || lateArrivals >= 3 || noBadgeSwipe) {
        await this.emitHRSignal('attendance_anomaly', record, sickDaysThisMonth + lateArrivals);
      }
    }
  }

  private async processTrainingOverdue(records: Array<Record<string, unknown>>): Promise<void> {
    for (const record of records) {
      const isComplianceTraining = String(record['trainingType'] ?? '').toLowerCase().includes('compliance') ||
        String(record['trainingType'] ?? '').toLowerCase().includes('aml') ||
        String(record['trainingType'] ?? '').toLowerCase().includes('bsa');

      if (isComplianceTraining) {
        await this.emitHRSignal('training_missed', record, null);
      }
    }
  }

  private async processPerformanceData(records: Array<Record<string, unknown>>): Promise<void> {
    for (const record of records) {
      const currentRating = Number(record['currentRating'] ?? 0);
      const previousRating = Number(record['previousRating'] ?? 0);
      const decline = previousRating - currentRating;

      if (decline >= 1.0 || currentRating <= 2.0) {
        await this.emitHRSignal('performance_decline', record, decline);
      }
    }
  }

  private async processLeavePatterns(records: Array<Record<string, unknown>>): Promise<void> {
    // Group by employee to detect patterns
    const byEmployee = new Map<string, Array<Record<string, unknown>>>();
    for (const record of records) {
      const empId = String(record['employeeId'] ?? 'unknown');
      const existing = byEmployee.get(empId) ?? [];
      existing.push(record);
      byEmployee.set(empId, existing);
    }

    for (const [empId, leaves] of byEmployee) {
      // Check for unusual patterns
      const mondayFriday = leaves.filter((l) => {
        const day = new Date(String(l['date'])).getDay();
        return day === 1 || day === 5;
      });

      if (mondayFriday.length > leaves.length * 0.6 && leaves.length >= 3) {
        await this.emitHRSignal('leave_pattern_change', { employeeId: empId, pattern: 'monday_friday_clustering', count: mondayFriday.length }, mondayFriday.length);
      }
    }
  }

  private async emitHRSignal(signalType: string, record: Record<string, unknown>, value: number | null): Promise<void> {
    const signal: NormalizedSignalEvent = {
      signalId: `hr_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      tenantId: this.context.tenantId,
      domain: 'hr',
      signalType: signalType as any,
      subjectType: 'employee',
      subjectId: String(record['employeeId'] ?? record['userId'] ?? 'unknown'),
      sourceSystem: 'hris',
      value,
      metadata: { ...record, role: record['jobTitle'] ?? record['role'] },
      timestamp: new Date(String(record['timestamp'] ?? record['date'] ?? Date.now())),
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

  private async enrichWithHRContext(subjectId: string): Promise<void> {
    const hrSignals = await prisma.signal.findMany({
      where: { tenantId: this.context.tenantId, domain: 'hr', subjectId, timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    });

    if (hrSignals.length > 0) {
      await this.sendMessage('fusion-agent', 'hr_context_enrichment', {
        subjectId,
        hrSignals: hrSignals.map((s) => ({ type: s.signalType, value: s.value, timestamp: s.timestamp.toISOString() })),
      });
    }
  }

  private async assessFlightRisk(subjectId: string): Promise<void> {
    const signals = await prisma.signal.findMany({
      where: { tenantId: this.context.tenantId, subjectId, timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } },
      orderBy: { timestamp: 'asc' },
    });

    const analysis = await this.reason(
      `Assess flight risk for employee ${subjectId} using the Workforce Behavioral Analytics skill.\n\nSignals (${signals.length}):\n${signals.map((s) => `[${s.domain}] ${s.signalType}: value=${s.value}`).join('\n')}\n\nApply the weighted attrition prediction model. Differentiate between burnout, attrition risk, and general disengagement. Recommend human-centric interventions only.`,
      'You are using the Workforce Behavioral Intelligence Expert skill. Apply I/O Psychology PhD-level analysis.',
      { requireReasoning: true },
    );

    await this.sendMessage('alert-router', 'hr_assessment_complete', {
      subjectId, analysis: analysis.content, reasoning: analysis.reasoning,
    });
  }
}
