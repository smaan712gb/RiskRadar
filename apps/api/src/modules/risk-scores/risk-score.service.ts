import { prisma } from '@riskradar/database';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError } from '../../lib/errors.js';

export class RiskScoreService {
  async listRiskScores(
    tenantId: string,
    filters: { subjectType?: string; minScore?: number; trajectory?: string },
    pagination: PaginationOptions,
  ) {
    const where = {
      tenantId,
      ...(filters.subjectType && { subjectType: filters.subjectType }),
      ...(filters.minScore && { overallScore: { gte: filters.minScore } }),
      ...(filters.trajectory && { trajectory: filters.trajectory }),
    };

    // Get latest score per subject using distinct
    const [scores, total] = await Promise.all([
      prisma.riskScore.findMany({
        where,
        orderBy: [{ overallScore: 'desc' }, { calculatedAt: 'desc' }],
        ...buildPrismaSkipTake(pagination),
      }),
      prisma.riskScore.count({ where }),
    ]);

    return { scores, pagination: buildPaginationMeta(total, pagination) };
  }

  async getSubjectRiskProfile(tenantId: string, subjectId: string) {
    const latestScore = await prisma.riskScore.findFirst({
      where: { tenantId, subjectId },
      orderBy: { calculatedAt: 'desc' },
    });

    if (!latestScore) throw new NotFoundError('RiskScore', subjectId);

    // Get historical scores for trajectory visualization
    const history = await prisma.riskScore.findMany({
      where: { tenantId, subjectId },
      orderBy: { calculatedAt: 'asc' },
      take: 180,
      select: {
        overallScore: true,
        domainScores: true,
        trajectory: true,
        calculatedAt: true,
      },
    });

    // Get active alerts for this subject
    const activeAlerts = await prisma.alert.findMany({
      where: {
        tenantId,
        subjectId,
        status: { in: ['new', 'under_review', 'confirmed'] },
      },
      select: { id: true, title: true, severity: true, compoundScore: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Get recent signals
    const recentSignals = await prisma.signal.findMany({
      where: {
        tenantId,
        subjectId,
        timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { timestamp: 'desc' },
      take: 50,
      select: { domain: true, signalType: true, value: true, timestamp: true, sourceSystem: true },
    });

    // Get digital twin comparison if available
    const signalMeta = recentSignals[0]?.sourceSystem;
    const trendData = history.map((h) => ({
      date: h.calculatedAt.toISOString().split('T')[0]!,
      score: h.overallScore,
      domainScores: h.domainScores,
    }));

    return {
      current: {
        overallScore: latestScore.overallScore,
        domainScores: latestScore.domainScores,
        trajectory: latestScore.trajectory,
        calculatedAt: latestScore.calculatedAt,
        modelVersion: latestScore.modelVersion,
      },
      trendData,
      activeAlerts,
      recentSignals: recentSignals.map((s) => ({
        domain: s.domain,
        signalType: s.signalType,
        value: s.value,
        timestamp: s.timestamp,
      })),
      signalsByDomain: this.groupSignalsByDomain(recentSignals),
    };
  }

  async getRiskHeatmap(tenantId: string) {
    // Get latest scores per subject, grouped for heatmap visualization
    const scores = await prisma.riskScore.findMany({
      where: { tenantId },
      orderBy: { calculatedAt: 'desc' },
      distinct: ['subjectId'],
      take: 500,
      select: {
        subjectId: true,
        subjectType: true,
        overallScore: true,
        domainScores: true,
        trajectory: true,
      },
    });

    const distribution = {
      critical: scores.filter((s) => s.overallScore >= 75).length,
      high: scores.filter((s) => s.overallScore >= 50 && s.overallScore < 75).length,
      medium: scores.filter((s) => s.overallScore >= 25 && s.overallScore < 50).length,
      low: scores.filter((s) => s.overallScore < 25).length,
    };

    const accelerating = scores.filter((s) => s.trajectory === 'accelerating');

    return {
      totalSubjects: scores.length,
      distribution,
      acceleratingRisks: accelerating.map((s) => ({
        subjectId: s.subjectId,
        subjectType: s.subjectType,
        score: s.overallScore,
      })),
      topRisks: scores.slice(0, 20).map((s) => ({
        subjectId: s.subjectId,
        subjectType: s.subjectType,
        score: s.overallScore,
        trajectory: s.trajectory,
        domainScores: s.domainScores,
      })),
    };
  }

  private groupSignalsByDomain(signals: Array<{ domain: string; signalType: string; value: number | null }>) {
    const groups = new Map<string, { count: number; types: Set<string> }>();
    for (const s of signals) {
      const group = groups.get(s.domain) ?? { count: 0, types: new Set() };
      group.count++;
      group.types.add(s.signalType);
      groups.set(s.domain, group);
    }
    return Object.fromEntries(
      [...groups.entries()].map(([domain, data]) => [domain, { count: data.count, signalTypes: [...data.types] }]),
    );
  }
}
