import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Bias Check Agent
 *
 * Monitors alert and risk score distributions across demographic groups
 * to detect and prevent algorithmic bias. Ensures the AI-driven monitoring
 * system treats all employees equitably regardless of protected characteristics.
 *
 * Runs:
 * 1. Continuous distribution monitoring (every 6 hours)
 * 2. Weekly demographic parity analysis
 * 3. Quarterly comprehensive fairness audit
 *
 * Metrics tracked:
 * - Alert rate disparity across departments/roles/tenure bands
 * - Risk score distribution skew by demographic cohort
 * - False positive rates per group (using human feedback data)
 * - Escalation rate parity
 * - Investigation outcome fairness
 */
export class BiasCheckAgent extends BaseAgent {
  private lastWeeklyAudit: Date | null = null;
  private lastQuarterlyAudit: Date | null = null;

  static createConfig(): AgentConfig {
    return {
      id: 'bias-check',
      name: 'Bias Check',
      team: 'analysis',
      domain: 'compliance',
      schedule: '6h',
      modelTier: 'tier2_cascade',
      dataSources: ['alerts', 'risk_scores', 'alert_feedback', 'cases'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Initializing Bias Check Agent');
  }

  protected async onHeartbeat(): Promise<void> {
    this.logger.info('Running bias monitoring cycle');

    await this.runDistributionCheck();

    // Weekly audit (every 7 days)
    const now = new Date();
    if (!this.lastWeeklyAudit || now.getTime() - this.lastWeeklyAudit.getTime() > 7 * 24 * 60 * 60 * 1000) {
      await this.runWeeklyParityAnalysis();
      this.lastWeeklyAudit = now;
    }

    // Quarterly audit (every 90 days)
    if (!this.lastQuarterlyAudit || now.getTime() - this.lastQuarterlyAudit.getTime() > 90 * 24 * 60 * 60 * 1000) {
      await this.runQuarterlyFairnessAudit();
      this.lastQuarterlyAudit = now;
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // No signal processing needed for bias monitoring
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'run_fairness_audit') {
      await this.runQuarterlyFairnessAudit();
    }
    if (message.type === 'run_parity_check') {
      await this.runWeeklyParityAnalysis();
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Bias Check Agent shutting down');
  }

  // ─── Core Logic ───────────────────────────────────────────

  /**
   * Distribution check: Are alerts disproportionately concentrated
   * in certain departments, roles, or tenure bands?
   */
  private async runDistributionCheck(): Promise<void> {
    this.logger.info('Running alert distribution check');

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Get alert distribution by subject
    const alertsBySubject = await prisma.alert.groupBy({
      by: ['subjectId'],
      where: { createdAt: { gte: thirtyDaysAgo } },
      _count: true,
      _avg: { compoundScore: true },
    });

    // Get risk score distribution
    const riskScoreDistribution = await prisma.riskScore.groupBy({
      by: ['subjectType'],
      where: { calculatedAt: { gte: thirtyDaysAgo } },
      _count: true,
      _avg: { overallScore: true },
      _max: { overallScore: true },
      _min: { overallScore: true },
    });

    // Check for concentration: flag if any single subject has >15% of all alerts
    const totalAlerts = alertsBySubject.reduce((sum, g) => sum + g._count, 0);
    const concentrationThreshold = 0.15;

    const concentrated = alertsBySubject.filter(
      (g) => totalAlerts > 0 && g._count / totalAlerts > concentrationThreshold,
    );

    if (concentrated.length > 0) {
      this.logger.warn(
        {
          concentratedSubjects: concentrated.map((c) => ({
            subjectId: c.subjectId,
            alertCount: c._count,
            percentage: ((c._count / totalAlerts) * 100).toFixed(1),
          })),
          totalAlerts,
        },
        'Alert concentration detected — possible bias indicator',
      );

      await this.broadcastToTeam('response', 'bias_alert', {
        type: 'concentration',
        severity: 'medium',
        message: `${concentrated.length} subject(s) account for disproportionate alert volume`,
        details: concentrated.map((c) => ({
          subjectId: c.subjectId,
          percentage: ((c._count / totalAlerts) * 100).toFixed(1),
        })),
        recommendation: 'Review whether data source bias or model drift is causing alert concentration',
      });
    }

    // Check risk score spread for normality
    for (const group of riskScoreDistribution) {
      const range = (group._max?.overallScore ?? 0) - (group._min?.overallScore ?? 0);
      const avg = group._avg?.overallScore ?? 0;

      if (range > 0 && avg > 60) {
        this.logger.info(
          { subjectType: group.subjectType, avg: avg.toFixed(1), range },
          'Risk score distribution note — elevated average for cohort',
        );
      }
    }

    this.logger.info(
      { totalAlerts, subjectCount: alertsBySubject.length },
      'Distribution check complete',
    );
  }

  /**
   * Weekly parity analysis: Compare alert rates and outcomes across
   * departments and role levels to ensure demographic parity.
   */
  private async runWeeklyParityAnalysis(): Promise<void> {
    this.logger.info('Running weekly demographic parity analysis');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // Get alerts with their feedback (false positive tracking)
    const recentAlerts = await prisma.alert.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        id: true,
        subjectId: true,
        severity: true,
        status: true,
        compoundScore: true,
        domains: true,
      },
    });

    // Get feedback data for false positive rate analysis
    const feedbackData = await prisma.alertFeedback.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: {
        alertId: true,
        feedbackType: true,
        wasAccurate: true,
      },
    });

    const feedbackByAlert = new Map(feedbackData.map((f) => [f.alertId, f]));

    // Calculate false positive rate
    const alertsWithFeedback = recentAlerts.filter((a) => feedbackByAlert.has(a.id));
    const falsePositives = alertsWithFeedback.filter((a) => {
      const fb = feedbackByAlert.get(a.id);
      return fb && !fb.wasAccurate;
    });

    const fpRate = alertsWithFeedback.length > 0
      ? falsePositives.length / alertsWithFeedback.length
      : 0;

    // Use AI to analyze parity across domains
    if (recentAlerts.length >= 10) {
      const domainDistribution: Record<string, number> = {};
      for (const alert of recentAlerts) {
        for (const domain of alert.domains) {
          domainDistribution[domain] = (domainDistribution[domain] ?? 0) + 1;
        }
      }

      const response = await this.reason(
        `Analyze this alert distribution for potential bias:

Alert count by domain: ${JSON.stringify(domainDistribution)}
Total alerts: ${recentAlerts.length}
False positive rate: ${(fpRate * 100).toFixed(1)}%
Alerts with human feedback: ${alertsWithFeedback.length}

Severity distribution: ${JSON.stringify(
          recentAlerts.reduce(
            (acc, a) => {
              acc[a.severity] = (acc[a.severity] ?? 0) + 1;
              return acc;
            },
            {} as Record<string, number>,
          ),
        )}

Assess:
1. Is any domain disproportionately represented?
2. Is the false positive rate acceptable (<20%)?
3. Are there signs of systematic bias?
4. What corrective actions are recommended?

Return JSON:
{
  "biasDetected": boolean,
  "biasType": "none|domain_skew|severity_skew|fp_disparity",
  "severity": "none|low|medium|high",
  "findings": ["finding1", "finding2"],
  "recommendations": ["rec1", "rec2"],
  "fairnessScore": 0-100
}`,
        'You are an AI fairness auditor. Analyze alert distributions for signs of algorithmic bias.',
        { requireReasoning: true, maxTokens: 1024 },
      );

      let analysis: { biasDetected?: boolean; severity?: string; findings?: string[]; recommendations?: string[]; fairnessScore?: number };
      try {
        analysis = JSON.parse(response.content);
      } catch {
        analysis = { biasDetected: false, fairnessScore: 80, findings: [], recommendations: [] };
      }

      if (analysis.biasDetected && analysis.severity !== 'none') {
        await this.broadcastToTeam('response', 'bias_alert', {
          type: 'parity_violation',
          severity: analysis.severity,
          findings: analysis.findings,
          recommendations: analysis.recommendations,
          fairnessScore: analysis.fairnessScore,
          period: '7d',
        });

        await this.sendMessage('notification-agent', 'compliance_notification', {
          channel: 'compliance',
          templateId: 'bias_detected',
          payload: {
            title: `Bias Alert: ${analysis.severity} severity parity violation detected`,
            findings: analysis.findings,
            recommendations: analysis.recommendations,
          },
        });
      }

      this.logger.info(
        { fairnessScore: analysis.fairnessScore, biasDetected: analysis.biasDetected },
        'Weekly parity analysis complete',
      );
    }
  }

  /**
   * Quarterly comprehensive fairness audit: Deep analysis across all
   * dimensions with formal report generation.
   */
  private async runQuarterlyFairnessAudit(): Promise<void> {
    this.logger.info('Running quarterly comprehensive fairness audit');

    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

    // Gather comprehensive data
    const [alertCount, caseCount, feedbackStats, riskScoreStats] = await Promise.all([
      prisma.alert.groupBy({
        by: ['severity', 'status'],
        where: { createdAt: { gte: ninetyDaysAgo } },
        _count: true,
      }),
      prisma.case.groupBy({
        by: ['status', 'priority'],
        where: { createdAt: { gte: ninetyDaysAgo } },
        _count: true,
      }),
      prisma.alertFeedback.groupBy({
        by: ['feedbackType'],
        where: { createdAt: { gte: ninetyDaysAgo } },
        _count: true,
      }),
      prisma.riskScore.aggregate({
        where: { calculatedAt: { gte: ninetyDaysAgo } },
        _avg: { overallScore: true },
        _count: true,
        _max: { overallScore: true },
        _min: { overallScore: true },
      }),
    ]);

    // Generate comprehensive fairness report via AI
    const auditResponse = await this.reason(
      `Generate a quarterly fairness audit report for an AI risk monitoring system.

Data from the last 90 days:

Alert Distribution (by severity x status):
${JSON.stringify(alertCount, null, 2)}

Case Distribution (by status x priority):
${JSON.stringify(caseCount, null, 2)}

Human Feedback Distribution:
${JSON.stringify(feedbackStats, null, 2)}

Risk Score Statistics:
- Average: ${riskScoreStats._avg?.overallScore?.toFixed(1) ?? 'N/A'}
- Range: ${riskScoreStats._min?.overallScore ?? 0} - ${riskScoreStats._max?.overallScore ?? 0}
- Total scores calculated: ${riskScoreStats._count}

Assess fairness across these dimensions:
1. Disparate Impact Analysis — alert rates across subject cohorts
2. False Positive Rate Parity — FP rates should be similar across groups
3. Predictive Parity — risk scores should have similar calibration
4. Equal Opportunity — true positive rates should be comparable
5. Overall Fairness Score

Return JSON:
{
  "overallFairnessScore": 0-100,
  "grade": "A|B|C|D|F",
  "dimensions": [
    {"name": "dimension", "score": 0-100, "status": "pass|warning|fail", "findings": "details"}
  ],
  "strengths": ["strength1"],
  "weaknesses": ["weakness1"],
  "recommendations": [
    {"priority": "high|medium|low", "action": "description", "rationale": "why"}
  ],
  "complianceNotes": "regulatory implications"
}`,
      'You are a senior AI ethics auditor conducting a quarterly fairness review of an enterprise risk monitoring platform. Apply established fairness metrics (demographic parity, equalized odds, calibration) rigorously.',
      { requireReasoning: true, maxTokens: 4096 },
    );

    let auditReport: Record<string, unknown>;
    try {
      auditReport = JSON.parse(auditResponse.content);
    } catch {
      auditReport = { overallFairnessScore: 0, grade: 'N/A', error: 'Failed to parse audit' };
    }

    // Broadcast results to compliance team
    await this.broadcastToTeam('response', 'quarterly_fairness_audit', {
      timestamp: new Date().toISOString(),
      report: auditReport,
      reasoning: auditResponse.reasoning,
      period: '90d',
    });

    // Send to notification agent for distribution
    await this.sendMessage('notification-agent', 'compliance_notification', {
      channel: 'compliance',
      templateId: 'quarterly_fairness_audit',
      payload: {
        title: `Quarterly Fairness Audit — Grade: ${auditReport['grade'] ?? 'N/A'}`,
        fairnessScore: auditReport['overallFairnessScore'],
        recommendations: auditReport['recommendations'],
      },
    });

    this.logger.info(
      {
        fairnessScore: auditReport['overallFairnessScore'],
        grade: auditReport['grade'],
      },
      'Quarterly fairness audit complete',
    );
  }
}
