import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';
import { SARGenerator, type SARDraft } from '../../engine/sar-generator.js';

/**
 * SAR Generator Agent
 *
 * Wraps the SARGenerator engine as a message-driven agent that:
 * 1. Listens for confirmed high-severity alerts requiring SAR filing
 * 2. Auto-drafts Suspicious Activity Reports in FinCEN format
 * 3. Routes drafts to BSA Officer for review and approval
 * 4. Tracks filing deadlines (30 calendar days from detection)
 * 5. Sends reminders as deadlines approach
 */
export class SARGeneratorAgent extends BaseAgent {
  private engine!: SARGenerator;

  static createConfig(): AgentConfig {
    return {
      id: 'sar-generator',
      name: 'SAR Generator',
      team: 'response',
      domain: 'compliance',
      schedule: '1h', // Hourly deadline check
      modelTier: 'tier2_cascade',
      dataSources: ['alerts', 'evidence', 'cases'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.engine = new SARGenerator(this.context.modelRouter);
    this.logger.info('SAR Generator Agent initialized');
  }

  protected async onHeartbeat(): Promise<void> {
    // Check for approaching SAR filing deadlines
    await this.checkFilingDeadlines();
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // No direct signal processing — SAR generation is message-driven
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'generate_sar') {
      const { tenantId, caseId, alertIds, subjectId, additionalContext } = message.payload as {
        tenantId: string;
        caseId: string;
        alertIds: string[];
        subjectId: string;
        additionalContext?: string;
      };

      this.logger.info({ caseId, alertCount: alertIds.length }, 'SAR generation requested');

      const draft = await this.engine.generateDraft({
        tenantId,
        caseId,
        alertIds,
        subjectId,
        generatedBy: 'sar-generator-agent',
        additionalContext,
      });

      // Notify the requesting agent
      await this.sendMessage(message.fromAgentId, 'sar_draft_ready', {
        sarDraftId: draft.id,
        caseId: draft.caseId,
        filingDeadline: draft.filingDeadline.toISOString(),
        status: draft.status,
      });

      // Notify compliance team
      await this.sendMessage('notification-agent', 'compliance_notification', {
        channel: 'compliance',
        templateId: 'sar_draft_ready',
        payload: {
          title: `SAR Draft Ready for Review — Case ${caseId}`,
          sarDraftId: draft.id,
          filingDeadline: draft.filingDeadline.toISOString(),
          narrative: draft.narrative.slice(0, 200) + '...',
        },
      });

      this.logger.info(
        { sarDraftId: draft.id, filingDeadline: draft.filingDeadline.toISOString() },
        'SAR draft generated and routed for review',
      );
    }

    if (message.type === 'confirmed_alert') {
      // Auto-generate SAR for confirmed high-severity alerts in banking tenants
      const { tenantId, alertId, caseId, subjectId, severity, compoundScore } = message.payload as {
        tenantId: string;
        alertId: string;
        caseId?: string;
        subjectId: string;
        severity: string;
        compoundScore: number;
      };

      // Only auto-draft for high/critical alerts with score >= 75
      if ((severity === 'critical' || severity === 'high') && compoundScore >= 75 && caseId) {
        this.logger.info(
          { alertId, caseId, compoundScore },
          'High-severity confirmed alert — auto-drafting SAR',
        );

        await this.engine.generateDraft({
          tenantId,
          caseId,
          alertIds: [alertId],
          subjectId,
          generatedBy: 'sar-generator-agent:auto',
        });
      }
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('SAR Generator Agent shutting down');
  }

  // ─── Private ──────────────────────────────────────────────

  private async checkFilingDeadlines(): Promise<void> {
    const { prisma } = await import('@riskradar/database');

    // Find drafts approaching deadline (within 7 days)
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();

    const approachingDeadline = await prisma.sarDraft.findMany({
      where: {
        status: 'draft',
        filingDeadline: { lte: sevenDaysFromNow, gte: now },
      },
      select: {
        id: true,
        caseId: true,
        tenantId: true,
        filingDeadline: true,
      },
    });

    if (approachingDeadline.length > 0) {
      this.logger.warn(
        { count: approachingDeadline.length },
        'SAR drafts approaching filing deadline',
      );

      for (const draft of approachingDeadline) {
        const daysRemaining = Math.ceil(
          (draft.filingDeadline.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        );

        await this.sendMessage('notification-agent', 'urgent_notification', {
          channel: 'compliance',
          templateId: 'sar_deadline_reminder',
          payload: {
            title: `SAR Filing Deadline: ${daysRemaining} days remaining`,
            sarDraftId: draft.id,
            caseId: draft.caseId,
            filingDeadline: draft.filingDeadline.toISOString(),
            daysRemaining,
          },
        });
      }
    }

    // Flag overdue drafts
    const overdue = await prisma.sarDraft.findMany({
      where: {
        status: 'draft',
        filingDeadline: { lt: now },
      },
      select: { id: true, caseId: true, tenantId: true, filingDeadline: true },
    });

    if (overdue.length > 0) {
      this.logger.error(
        { count: overdue.length },
        'OVERDUE SAR drafts detected — regulatory risk',
      );

      for (const draft of overdue) {
        await this.sendMessage('notification-agent', 'urgent_notification', {
          channel: 'all',
          templateId: 'sar_overdue',
          payload: {
            title: `OVERDUE: SAR filing past deadline for Case ${draft.caseId}`,
            sarDraftId: draft.id,
            caseId: draft.caseId,
            filingDeadline: draft.filingDeadline.toISOString(),
          },
        });
      }
    }
  }
}
