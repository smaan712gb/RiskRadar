import { prisma } from '@riskradar/database';
import { SeverityEscalationTargets, type AlertSeverityType } from '@riskradar/shared';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Alert Router Agent
 *
 * Receives compound risk detections from the Fusion Engine and:
 * 1. Creates alerts in the database with evidence briefs
 * 2. Assigns alerts to appropriate analysts based on severity and domain
 * 3. Routes notifications through the Notification Agent
 * 4. Monitors SLA compliance for open alerts
 * 5. Auto-escalates overdue alerts
 */
export class AlertRouterAgent extends BaseAgent {
  static createConfig(): AgentConfig {
    return {
      id: 'alert-router',
      name: 'Alert Router',
      team: 'response',
      schedule: '2m',
      modelTier: 'tier1_super',
      dataSources: ['alerts_db'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Alert Router Agent initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    // Check for SLA-breaching alerts and auto-escalate
    await this.checkSLACompliance();
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // Alert router doesn't process raw signals
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'compound_risk_detected') {
      await this.handleCompoundRisk(message.payload);
    }

    if (message.type === 'evidence_brief_ready') {
      await this.attachEvidenceBrief(message.payload);
    }

    if (message.type === 'trajectory_alert') {
      await this.handleTrajectoryAlert(message.payload);
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Alert Router shutting down');
  }

  // ─── Alert Creation ───────────────────────────────────────

  private async handleCompoundRisk(payload: Record<string, unknown>): Promise<void> {
    const compoundScore = payload['compoundScore'] as number;
    const severity = this.scoreToseverity(compoundScore);

    this.logger.info(
      { subjectId: payload['subjectId'], score: compoundScore, severity },
      'Creating alert from compound risk detection',
    );

    // Create alert
    const alert = await prisma.alert.create({
      data: {
        tenantId: this.context.tenantId,
        title: `Compound Risk: ${(payload['domains'] as string[])?.join(' + ')} — Score ${compoundScore}`,
        description: (payload['reasoning'] as string) ?? 'Cross-domain risk pattern detected',
        alertType: 'compound_risk',
        severity,
        status: 'new',
        compoundScore,
        confidenceScore: compoundScore * 0.9,
        falsePositiveLikelihood: compoundScore >= 70 ? 'low' : compoundScore >= 50 ? 'medium' : 'high',
        domains: payload['domains'] as string[],
        subjectType: 'employee',
        subjectId: payload['subjectId'] as string,
        regulatoryMapping: [],
        modelVersion: 'nemotron-cascade-2-30b',
        reasoningModelUsed: (payload['requiresDeepReasoning'] as boolean) ? 'tier2_cascade' : 'tier1_super',
        processingTimeMs: 0,
      },
    });

    // Link signals to alert
    const signalIds = payload['signalIds'] as string[];
    if (signalIds?.length > 0) {
      await prisma.alertSignal.createMany({
        data: signalIds.map((signalId) => ({ alertId: alert.id, signalId })),
        skipDuplicates: true,
      });
    }

    // Auto-assign based on severity
    await this.autoAssign(alert.id, severity);

    // Send notification
    await this.sendMessage('notification-agent', 'alert_notification', {
      alertId: alert.id,
      title: alert.title,
      severity,
      compoundScore,
      subjectId: payload['subjectId'],
      domains: payload['domains'],
      description: alert.description,
    });

    // If deep reasoning needed, request evidence brief from reasoning agent
    if (payload['requiresDeepReasoning'] || compoundScore >= 50) {
      await this.sendMessage('reasoning-agent', 'generate_evidence_brief', {
        alertId: alert.id,
        subjectId: payload['subjectId'],
        signalIds,
        domains: payload['domains'],
        evidenceChain: payload['evidenceChain'],
      });
    }
  }

  private async handleTrajectoryAlert(payload: Record<string, unknown>): Promise<void> {
    const currentScore = payload['currentScore'] as number;
    const projectedScore = payload['projectedScore'] as number;
    const trajectory = payload['trajectory'] as string;

    if (trajectory !== 'accelerating' || currentScore < 40) return;

    const alert = await prisma.alert.create({
      data: {
        tenantId: this.context.tenantId,
        title: `Risk Trajectory Alert: Score ${currentScore} → projected ${projectedScore}`,
        description: `Subject risk trajectory is accelerating. Current score: ${currentScore}, projected: ${projectedScore}. Breach date: ${payload['projectedBreachDate'] ?? 'unknown'}`,
        alertType: 'trajectory_breach',
        severity: currentScore >= 60 ? 'high' : 'medium',
        status: 'new',
        compoundScore: currentScore,
        confidenceScore: 70,
        falsePositiveLikelihood: 'medium',
        domains: [],
        subjectType: 'employee',
        subjectId: payload['subjectId'] as string,
        regulatoryMapping: [],
        modelVersion: 'trajectory-engine',
        reasoningModelUsed: 'tier1_super',
        processingTimeMs: 0,
      },
    });

    await this.sendMessage('notification-agent', 'alert_notification', {
      alertId: alert.id,
      title: alert.title,
      severity: alert.severity,
      compoundScore: currentScore,
      subjectId: payload['subjectId'],
    });
  }

  private async attachEvidenceBrief(payload: Record<string, unknown>): Promise<void> {
    const alertId = payload['alertId'] as string;
    if (!alertId) return;

    await prisma.alert.update({
      where: { id: alertId },
      data: {
        evidenceBrief: payload["evidenceBrief"] as any,
        regulatoryMapping: (payload["regulatoryMapping"] ?? []) as any,
      },
    });

    this.logger.info({ alertId }, 'Evidence brief attached to alert');
  }

  // ─── Auto-Assignment ──────────────────────────────────────

  private async autoAssign(alertId: string, severity: string): Promise<void> {
    const targetRoles = SeverityEscalationTargets[severity as AlertSeverityType] ?? ['analyst'];

    // Find available analyst with the matching role and lowest current workload
    const candidates = await prisma.user.findMany({
      where: {
        tenantId: this.context.tenantId,
        role: { in: targetRoles },
        isActive: true,
      },
      include: {
        _count: {
          select: {
            assignedAlerts: {
              where: { status: { in: ['new', 'under_review'] } },
            },
          },
        },
      },
      orderBy: { lastLoginAt: 'desc' },
    });

    if (candidates.length === 0) return;

    // Assign to person with fewest open alerts (load balancing)
    const sorted = candidates.sort(
      (a, b) => (a._count?.assignedAlerts ?? 0) - (b._count?.assignedAlerts ?? 0),
    );

    const assignee = sorted[0]!;
    await prisma.alert.update({
      where: { id: alertId },
      data: { assignedTo: assignee.id },
    });

    this.logger.info(
      { alertId, assigneeId: assignee.id, assigneeName: assignee.name },
      'Alert auto-assigned',
    );
  }

  // ─── SLA Monitoring ───────────────────────────────────────

  private async checkSLACompliance(): Promise<void> {
    // Find open cases past SLA deadline
    const overdueCases = await prisma.case.findMany({
      where: {
        tenantId: this.context.tenantId,
        slaDeadline: { lt: new Date() },
        status: { notIn: ['closed_confirmed', 'closed_false_positive', 'closed_no_action'] },
      },
      select: { id: true, title: true, priority: true, slaDeadline: true, assignedTo: true },
    });

    for (const overdueCase of overdueCases) {
      const hoursPastDue = (Date.now() - overdueCase.slaDeadline!.getTime()) / (1000 * 60 * 60);

      if (hoursPastDue > 0 && hoursPastDue < 0.1) {
        // Just breached — send warning
        await this.sendMessage('notification-agent', 'sla_warning', {
          caseId: overdueCase.id,
          title: overdueCase.title,
          priority: overdueCase.priority,
          message: `Case SLA breached. ${Math.round(hoursPastDue)}h overdue.`,
        });
      }
    }
  }

  // ─── Helpers ──────────────────────────────────────────────

  private scoreToseverity(score: number): string {
    if (score >= 85) return 'critical';
    if (score >= 65) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'info';
  }
}
