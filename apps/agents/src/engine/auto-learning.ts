import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import type { RiskDomainType } from '@riskradar/shared';

const logger = createLogger('auto-learning');

/**
 * Auto-Learning Engine
 *
 * This is the self-improving intelligence core of RiskRadar.
 * It continuously learns from human feedback, environmental changes,
 * and detection outcomes to improve alert quality over time.
 *
 * Learning Mechanisms:
 * 1. Threshold Adjustment — Tunes alert thresholds based on confirmed/dismissed outcomes
 * 2. Pattern Refinement — Identifies new compound risk patterns from confirmed cases
 * 3. False Positive Analysis — Detects systematic FP sources and suppresses them
 * 4. Digital Twin Calibration — Updates role-based behavioral baselines
 * 5. Seasonal Adjustment — Adapts to cyclical business patterns
 * 6. Model Drift Detection — Monitors inference quality over time
 */
export class AutoLearningEngine {
  /**
   * Process alert feedback and adjust thresholds.
   * When analysts confirm or dismiss alerts, this data feeds back
   * into the system to improve future alert precision.
   */
  async processAlertFeedback(input: {
    tenantId: string;
    alertId: string;
    alertType: string;
    severity: string;
    domains: string[];
    compoundScore: number;
    outcome: 'confirmed' | 'dismissed';
    feedbackBy: string;
    notes?: string;
  }): Promise<ThresholdAdjustment | null> {
    // Store feedback
    await prisma.alertFeedback.create({
      data: {
        tenantId: input.tenantId,
        alertId: input.alertId,
        alertType: input.alertType,
        severity: input.severity,
        domains: input.domains,
        compoundScore: input.compoundScore,
        outcome: input.outcome,
        feedbackBy: input.feedbackBy,
        notes: input.notes ?? null,
      },
    });

    // Analyze feedback patterns for this alert type
    const recentFeedback = await prisma.alertFeedback.findMany({
      where: {
        tenantId: input.tenantId,
        alertType: input.alertType,
        feedbackAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }, // 30 days
      },
    });

    if (recentFeedback.length < 10) {
      return null; // Not enough data to adjust
    }

    const confirmed = recentFeedback.filter((f) => f.outcome === 'confirmed');
    const dismissed = recentFeedback.filter((f) => f.outcome === 'dismissed');
    const fpRate = dismissed.length / recentFeedback.length;

    logger.info(
      {
        alertType: input.alertType,
        total: recentFeedback.length,
        confirmed: confirmed.length,
        dismissed: dismissed.length,
        fpRate: fpRate.toFixed(2),
      },
      'Analyzing feedback pattern',
    );

    // If FP rate > 40%, raise threshold
    if (fpRate > 0.4) {
      const avgDismissedScore = dismissed.reduce((sum, f) => sum + f.compoundScore, 0) / dismissed.length;
      const avgConfirmedScore = confirmed.length > 0
        ? confirmed.reduce((sum, f) => sum + f.compoundScore, 0) / confirmed.length
        : 100;

      // New threshold: midpoint between average dismissed and average confirmed scores
      const newThreshold = (avgDismissedScore + avgConfirmedScore) / 2;

      const adjustment: ThresholdAdjustment = {
        alertType: input.alertType,
        previousThreshold: avgDismissedScore,
        newThreshold,
        reason: `FP rate ${(fpRate * 100).toFixed(0)}% (${dismissed.length}/${recentFeedback.length}) over 30 days`,
        confidence: Math.min(recentFeedback.length / 50, 1.0),
        sampleSize: recentFeedback.length,
      };

      // Persist adjustment
      await this.saveThresholdAdjustment(input.tenantId, adjustment);

      logger.info({ adjustment }, 'Threshold adjustment recommended');
      return adjustment;
    }

    return null;
  }

  /**
   * Detect and learn new compound risk patterns.
   * Analyzes confirmed alerts to discover recurring signal combinations
   * that weren't in the original policy set.
   */
  async discoverPatterns(tenantId: string): Promise<DiscoveredPattern[]> {
    // Get all confirmed compound alerts from last 90 days
    const confirmedAlerts = await prisma.alert.findMany({
      where: {
        tenantId,
        status: 'confirmed',
        alertType: 'compound_risk',
        createdAt: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      include: {
        alertSignals: true,
      },
    });

    if (confirmedAlerts.length < 5) return [];

    // Extract domain combinations from confirmed alerts
    const domainCombinations = new Map<string, number>();
    for (const alert of confirmedAlerts) {
      const key = (alert.domains as string[]).sort().join('+');
      domainCombinations.set(key, (domainCombinations.get(key) ?? 0) + 1);
    }

    // Identify patterns that appear in >20% of confirmed alerts
    const threshold = confirmedAlerts.length * 0.2;
    const patterns: DiscoveredPattern[] = [];

    for (const [combination, count] of domainCombinations) {
      if (count >= threshold) {
        patterns.push({
          domainCombination: combination.split('+') as RiskDomainType[],
          frequency: count,
          totalConfirmed: confirmedAlerts.length,
          confidence: count / confirmedAlerts.length,
          suggestedPolicyName: `auto_pattern_${combination.replace(/\+/g, '_')}`,
        });
      }
    }

    if (patterns.length > 0) {
      logger.info({ patternCount: patterns.length }, 'Discovered new risk patterns');
    }

    return patterns;
  }

  /**
   * Analyze false positive sources to identify systematic noise.
   * Finds signal types or data sources that consistently produce FPs.
   */
  async analyzeFalsePositiveSources(tenantId: string): Promise<FPSourceAnalysis[]> {
    const dismissed = await prisma.alertFeedback.findMany({
      where: {
        tenantId,
        outcome: 'dismissed',
        feedbackAt: { gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000) },
      },
    });

    if (dismissed.length < 20) return [];

    // Group by alert type and domain
    const sources = new Map<string, { count: number; domains: string[] }>();
    for (const fb of dismissed) {
      const key = fb.alertType;
      const existing = sources.get(key) ?? { count: 0, domains: [] };
      existing.count++;
      existing.domains.push(...(fb.domains as string[]));
      sources.set(key, existing);
    }

    const analyses: FPSourceAnalysis[] = [];
    for (const [alertType, data] of sources) {
      if (data.count >= 5) {
        // Find most common domain in FPs
        const domainCounts = new Map<string, number>();
        for (const d of data.domains) {
          domainCounts.set(d, (domainCounts.get(d) ?? 0) + 1);
        }
        const topDomain = [...domainCounts.entries()].sort((a, b) => b[1] - a[1])[0];

        analyses.push({
          alertType,
          fpCount: data.count,
          totalDismissed: dismissed.length,
          primaryDomain: topDomain?.[0] ?? 'unknown',
          recommendation: data.count > 10
            ? 'Consider raising threshold or adding exclusion rule'
            : 'Monitor — may indicate noisy data source',
        });
      }
    }

    return analyses;
  }

  /**
   * Update digital twin baselines for role archetypes.
   * Recalculates behavioral baselines from current signal data.
   */
  async updateDigitalTwins(tenantId: string): Promise<void> {
    // Get all subjects grouped by role (from signals metadata)
    const signals = await prisma.signal.findMany({
      where: {
        tenantId,
        timestamp: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) },
      },
      select: {
        subjectId: true,
        signalType: true,
        value: true,
        metadata: true,
        domain: true,
      },
    });

    if (signals.length === 0) return;

    // Group signals by role archetype (extracted from metadata)
    const roleSignals = new Map<string, typeof signals>();
    for (const signal of signals) {
      const meta = signal.metadata as Record<string, unknown>;
      const role = (meta?.['role'] as string) ?? 'unknown';
      const existing = roleSignals.get(role) ?? [];
      existing.push(signal);
      roleSignals.set(role, existing);
    }

    // Calculate baselines per role
    for (const [role, roleData] of roleSignals) {
      if (roleData.length < 50) continue; // Need sufficient data

      const signalTypeStats = new Map<string, { values: number[]; count: number }>();
      for (const signal of roleData) {
        const stats = signalTypeStats.get(signal.signalType) ?? { values: [], count: 0 };
        if (signal.value != null) stats.values.push(signal.value);
        stats.count++;
        signalTypeStats.set(signal.signalType, stats);
      }

      const baselineData: Record<string, { mean: number; stddev: number; count: number }> = {};
      for (const [signalType, stats] of signalTypeStats) {
        if (stats.values.length > 0) {
          const mean = stats.values.reduce((a, b) => a + b, 0) / stats.values.length;
          const variance =
            stats.values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / stats.values.length;
          baselineData[signalType] = {
            mean,
            stddev: Math.sqrt(variance),
            count: stats.count,
          };
        }
      }

      const uniqueSubjects = new Set(roleData.map((s) => s.subjectId));

      await prisma.digitalTwin.upsert({
        where: {
          tenantId_roleArchetype_department: {
            tenantId,
            roleArchetype: role,
            department: 'all',
          },
        },
        update: {
          baselineData: baselineData as any,
          sampleSize: uniqueSubjects.size,
          confidenceLevel: Math.min(uniqueSubjects.size / 20, 1.0),
          lastCalculated: new Date(),
          version: { increment: 1 },
        },
        create: {
          tenantId,
          roleArchetype: role,
          department: 'all',
          baselineData: baselineData as any,
          sampleSize: uniqueSubjects.size,
          confidenceLevel: Math.min(uniqueSubjects.size / 20, 1.0),
        },
      });
    }

    logger.info(
      { roleCount: roleSignals.size, tenantId },
      'Digital twins updated',
    );
  }

  /**
   * Detect model drift by comparing recent inference quality
   * against historical baselines.
   */
  async checkModelDrift(tenantId: string): Promise<DriftReport | null> {
    const recentFeedback = await prisma.alertFeedback.findMany({
      where: {
        tenantId,
        feedbackAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    const historicalFeedback = await prisma.alertFeedback.findMany({
      where: {
        tenantId,
        feedbackAt: {
          gte: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
          lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
    });

    if (recentFeedback.length < 10 || historicalFeedback.length < 20) return null;

    const recentFPRate =
      recentFeedback.filter((f) => f.outcome === 'dismissed').length / recentFeedback.length;
    const historicalFPRate =
      historicalFeedback.filter((f) => f.outcome === 'dismissed').length / historicalFeedback.length;

    const driftMagnitude = Math.abs(recentFPRate - historicalFPRate);

    if (driftMagnitude > 0.15) {
      const report: DriftReport = {
        recentFPRate,
        historicalFPRate,
        driftMagnitude,
        direction: recentFPRate > historicalFPRate ? 'degrading' : 'improving',
        recentSampleSize: recentFeedback.length,
        historicalSampleSize: historicalFeedback.length,
        recommendation:
          recentFPRate > historicalFPRate
            ? 'Model quality degrading. Consider retuning thresholds or reviewing data source quality.'
            : 'Model quality improving. Current thresholds are well-calibrated.',
      };

      logger.warn({ report }, 'Model drift detected');
      return report;
    }

    return null;
  }

  /**
   * Seasonal adjustment — detect cyclical patterns
   * (end-of-quarter, holidays, audit periods) and auto-adjust sensitivity.
   */
  async detectSeasonalPatterns(tenantId: string): Promise<SeasonalAdjustment[]> {
    // Get signal volumes by week for the past 6 months
    const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
    await prisma.signal.groupBy({
      by: ['domain', 'signalType'],
      where: {
        tenantId,
        timestamp: { gte: sixMonthsAgo },
      },
      _count: true,
    });

    // For now, return empty — this will be enhanced with time-series analysis
    // when TimescaleDB continuous aggregates are available
    return [];
  }

  // ─── Private Helpers ──────────────────────────────────────

  private async saveThresholdAdjustment(
    tenantId: string,
    adjustment: ThresholdAdjustment,
  ): Promise<void> {
    await prisma.learningState.upsert({
      where: {
        tenantId_learningType_key: {
          tenantId,
          learningType: 'threshold_adjustment',
          key: adjustment.alertType,
        },
      },
      update: {
        state: adjustment as any,
        lastUpdatedAt: new Date(),
        version: { increment: 1 },
      },
      create: {
        tenantId,
        learningType: 'threshold_adjustment',
        key: adjustment.alertType,
        state: adjustment as any,
      },
    });
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface ThresholdAdjustment {
  alertType: string;
  previousThreshold: number;
  newThreshold: number;
  reason: string;
  confidence: number;
  sampleSize: number;
}

export interface DiscoveredPattern {
  domainCombination: RiskDomainType[];
  frequency: number;
  totalConfirmed: number;
  confidence: number;
  suggestedPolicyName: string;
}

export interface FPSourceAnalysis {
  alertType: string;
  fpCount: number;
  totalDismissed: number;
  primaryDomain: string;
  recommendation: string;
}

export interface DriftReport {
  recentFPRate: number;
  historicalFPRate: number;
  driftMagnitude: number;
  direction: 'degrading' | 'improving';
  recentSampleSize: number;
  historicalSampleSize: number;
  recommendation: string;
}

export interface SeasonalAdjustment {
  domain: RiskDomainType;
  period: string;
  adjustmentFactor: number;
  reason: string;
}
