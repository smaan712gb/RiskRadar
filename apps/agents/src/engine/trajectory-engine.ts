import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import type { SubjectType, TrendDataPoint, RiskTrajectory } from '@riskradar/shared';

const logger = createLogger('trajectory-engine');

/**
 * Predictive Risk Trajectory Engine
 *
 * Instead of point-in-time risk scores, this engine projects risk trajectories forward.
 * It answers: "Is this entity's risk accelerating, stable, or declining?"
 * and predicts when thresholds will be breached if trends continue.
 *
 * Methods:
 * - Linear regression on risk score history
 * - Weighted moving average (recent scores weighted higher)
 * - Rate-of-change detection for inflection points
 * - Projected breach date calculation
 */
export class TrajectoryEngine {
  /**
   * Calculate risk trajectory for a subject.
   */
  async calculateTrajectory(
    tenantId: string,
    subjectType: SubjectType,
    subjectId: string,
  ): Promise<TrajectoryResult> {
    // Get historical risk scores (up to 180 days)
    const scores = await prisma.riskScore.findMany({
      where: {
        tenantId,
        subjectType,
        subjectId,
      },
      orderBy: { calculatedAt: 'asc' },
      take: 180,
    });

    if (scores.length < 3) {
      return {
        subjectId,
        subjectType,
        trajectory: 'new',
        currentScore: scores[scores.length - 1]?.overallScore ?? 0,
        projectedScore: null,
        projectedBreachDate: null,
        trendData: scores.map((s) => ({
          date: s.calculatedAt.toISOString().split('T')[0]!,
          score: s.overallScore,
        })),
        interventionRecommended: false,
        confidence: 0,
      };
    }

    const trendData: TrendDataPoint[] = scores.map((s) => ({
      date: s.calculatedAt.toISOString().split('T')[0]!,
      score: s.overallScore,
    }));

    const currentScore = scores[scores.length - 1]!.overallScore;

    // Calculate trajectory using weighted moving average
    const trajectory = this.determineTrajectory(scores.map((s) => s.overallScore));

    // Linear regression for projection
    const regression = this.linearRegression(
      scores.map((s, i) => ({ x: i, y: s.overallScore })),
    );

    // Project score 14 days ahead
    const projectedScore = Math.min(
      100,
      Math.max(0, regression.slope * (scores.length + 14) + regression.intercept),
    );

    // Calculate projected breach date
    let projectedBreachDate: string | null = null;
    const thresholdHigh = 75;

    if (currentScore < thresholdHigh && regression.slope > 0) {
      const daysToBreachRaw = (thresholdHigh - currentScore) / regression.slope;
      const daysToBreach = Math.ceil(daysToBreachRaw);
      if (daysToBreach > 0 && daysToBreach < 365) {
        const breachDate = new Date();
        breachDate.setDate(breachDate.getDate() + daysToBreach);
        projectedBreachDate = breachDate.toISOString().split('T')[0]!;
      }
    }

    // Determine if intervention is recommended
    const interventionRecommended =
      trajectory === 'accelerating' &&
      (currentScore >= 50 || (projectedScore >= 70 && projectedBreachDate !== null));

    // Confidence based on data points and R²
    const confidence = Math.min(
      (scores.length / 30) * regression.rSquared,
      1.0,
    );

    const result: TrajectoryResult = {
      subjectId,
      subjectType,
      trajectory,
      currentScore,
      projectedScore: Math.round(projectedScore * 10) / 10,
      projectedBreachDate,
      trendData,
      interventionRecommended,
      confidence: Math.round(confidence * 100) / 100,
      rateOfChange: Math.round(regression.slope * 100) / 100,
    };

    if (interventionRecommended) {
      logger.warn(
        {
          subjectId,
          currentScore,
          projectedScore: result.projectedScore,
          projectedBreachDate,
          trajectory,
        },
        'Intervention recommended — risk trajectory accelerating',
      );
    }

    return result;
  }

  // ─── Private Methods ──────────────────────────────────────

  private determineTrajectory(scores: number[]): RiskTrajectory {
    if (scores.length < 3) return 'new';

    // Use weighted rate of change (recent scores weighted 2x)
    const recentWindow = scores.slice(-7);
    const olderWindow = scores.slice(-14, -7);

    if (recentWindow.length < 2) return 'stable';

    const recentAvg = recentWindow.reduce((a, b) => a + b, 0) / recentWindow.length;
    const olderAvg =
      olderWindow.length > 0
        ? olderWindow.reduce((a, b) => a + b, 0) / olderWindow.length
        : recentAvg;

    const changeRate = (recentAvg - olderAvg) / Math.max(olderAvg, 1);

    if (changeRate > 0.1) return 'accelerating';
    if (changeRate < -0.1) return 'declining';
    return 'stable';
  }

  private linearRegression(
    points: Array<{ x: number; y: number }>,
  ): { slope: number; intercept: number; rSquared: number } {
    const n = points.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0,
      sumYY = 0;

    for (const { x, y } of points) {
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
      sumYY += y * y;
    }

    const denominator = n * sumXX - sumX * sumX;
    if (denominator === 0) return { slope: 0, intercept: sumY / n, rSquared: 0 };

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    // R² calculation
    const yMean = sumY / n;
    let ssRes = 0,
      ssTot = 0;
    for (const { x, y } of points) {
      const predicted = slope * x + intercept;
      ssRes += (y - predicted) ** 2;
      ssTot += (y - yMean) ** 2;
    }
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot;

    return { slope, intercept, rSquared: Math.max(0, rSquared) };
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface TrajectoryResult {
  subjectId: string;
  subjectType: SubjectType;
  trajectory: RiskTrajectory;
  currentScore: number;
  projectedScore: number | null;
  projectedBreachDate: string | null;
  trendData: TrendDataPoint[];
  interventionRecommended: boolean;
  confidence: number;
  rateOfChange?: number;
}
