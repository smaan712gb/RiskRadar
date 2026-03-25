import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RiskScoreService } from './risk-score.service.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    riskScore: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    alert: { findMany: vi.fn() },
    signal: { findMany: vi.fn() },
  },
}));

const { prisma } = await import('@riskradar/database');

describe('RiskScoreService', () => {
  let service: RiskScoreService;

  beforeEach(() => {
    service = new RiskScoreService();
    vi.clearAllMocks();
  });

  // ─── listRiskScores ──────────────────────────────────────

  describe('listRiskScores', () => {
    it('returns paginated risk scores', async () => {
      const mockScores = [
        { id: 'rs-1', subjectId: 'emp-1', overallScore: 82, trajectory: 'accelerating' },
        { id: 'rs-2', subjectId: 'emp-2', overallScore: 45, trajectory: 'stable' },
      ];

      vi.mocked(prisma.riskScore.findMany).mockResolvedValue(mockScores as any);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(2);

      const result = await service.listRiskScores(
        'tenant-1',
        {},
        { page: 1, pageSize: 20 },
      );

      expect(result.scores).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('filters by subjectType', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(0);

      await service.listRiskScores(
        'tenant-1',
        { subjectType: 'employee' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ subjectType: 'employee' }),
        }),
      );
    });

    it('filters by minimum score', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(0);

      await service.listRiskScores(
        'tenant-1',
        { minScore: 75 },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            overallScore: { gte: 75 },
          }),
        }),
      );
    });

    it('filters by trajectory', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(0);

      await service.listRiskScores(
        'tenant-1',
        { trajectory: 'accelerating' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ trajectory: 'accelerating' }),
        }),
      );
    });

    it('handles pagination offset correctly', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(100);

      const result = await service.listRiskScores(
        'tenant-1',
        {},
        { page: 4, pageSize: 25 },
      );

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 75, take: 25 }),
      );
      expect(result.pagination.totalPages).toBe(4);
      expect(result.pagination.hasNext).toBe(false);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('orders by overallScore descending', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.count).mockResolvedValue(0);

      await service.listRiskScores('tenant-1', {}, { page: 1, pageSize: 20 });

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ overallScore: 'desc' }, { calculatedAt: 'desc' }],
        }),
      );
    });
  });

  // ─── getSubjectRiskProfile ───────────────────────────────

  describe('getSubjectRiskProfile', () => {
    const mockLatestScore = {
      id: 'rs-1',
      tenantId: 'tenant-1',
      subjectId: 'emp-1',
      overallScore: 78,
      domainScores: { finance: 85, security: 70, hr: 60 },
      trajectory: 'accelerating',
      calculatedAt: new Date('2025-06-15T10:00:00Z'),
      modelVersion: 'v2.1',
    };

    const mockHistory = [
      { overallScore: 50, domainScores: { finance: 55 }, trajectory: 'rising', calculatedAt: new Date('2025-05-01') },
      { overallScore: 65, domainScores: { finance: 70 }, trajectory: 'rising', calculatedAt: new Date('2025-05-15') },
      { overallScore: 78, domainScores: { finance: 85 }, trajectory: 'accelerating', calculatedAt: new Date('2025-06-15') },
    ];

    it('returns trend data, active alerts, and recent signals', async () => {
      vi.mocked(prisma.riskScore.findFirst).mockResolvedValue(mockLatestScore as any);
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue(mockHistory as any);
      vi.mocked(prisma.alert.findMany).mockResolvedValue([
        { id: 'alert-1', title: 'Override Pattern', severity: 'high', compoundScore: 78, createdAt: new Date() },
      ] as any);
      vi.mocked(prisma.signal.findMany).mockResolvedValue([
        { domain: 'finance', signalType: 'override_transaction', value: 50000, timestamp: new Date(), sourceSystem: 'erp' },
        { domain: 'finance', signalType: 'new_payee', value: 25000, timestamp: new Date(), sourceSystem: 'erp' },
        { domain: 'security', signalType: 'after_hours_access', value: null, timestamp: new Date(), sourceSystem: 'badge' },
      ] as any);

      const profile = await service.getSubjectRiskProfile('tenant-1', 'emp-1');

      // Current score
      expect(profile.current.overallScore).toBe(78);
      expect(profile.current.trajectory).toBe('accelerating');
      expect(profile.current.modelVersion).toBe('v2.1');

      // Trend data
      expect(profile.trendData).toHaveLength(3);
      expect(profile.trendData[0]!.score).toBe(50);
      expect(profile.trendData[2]!.score).toBe(78);

      // Active alerts
      expect(profile.activeAlerts).toHaveLength(1);
      expect(profile.activeAlerts[0]!.severity).toBe('high');

      // Recent signals
      expect(profile.recentSignals).toHaveLength(3);

      // Signals grouped by domain
      expect(profile.signalsByDomain).toHaveProperty('finance');
      expect(profile.signalsByDomain.finance.count).toBe(2);
      expect(profile.signalsByDomain.finance.signalTypes).toContain('override_transaction');
      expect(profile.signalsByDomain).toHaveProperty('security');
      expect(profile.signalsByDomain.security.count).toBe(1);
    });

    it('throws NotFoundError when no score exists for subject', async () => {
      vi.mocked(prisma.riskScore.findFirst).mockResolvedValue(null);

      await expect(
        service.getSubjectRiskProfile('tenant-1', 'nonexistent'),
      ).rejects.toThrow('not found');
    });

    it('returns empty arrays when no alerts or signals exist', async () => {
      vi.mocked(prisma.riskScore.findFirst).mockResolvedValue(mockLatestScore as any);
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([mockHistory[2]!] as any);
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      const profile = await service.getSubjectRiskProfile('tenant-1', 'emp-1');

      expect(profile.activeAlerts).toEqual([]);
      expect(profile.recentSignals).toEqual([]);
      expect(profile.signalsByDomain).toEqual({});
    });

    it('queries active alerts with correct status filter', async () => {
      vi.mocked(prisma.riskScore.findFirst).mockResolvedValue(mockLatestScore as any);
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      await service.getSubjectRiskProfile('tenant-1', 'emp-1');

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            subjectId: 'emp-1',
            status: { in: ['new', 'under_review', 'confirmed'] },
          }),
        }),
      );
    });

    it('queries recent signals from the last 30 days', async () => {
      vi.mocked(prisma.riskScore.findFirst).mockResolvedValue(mockLatestScore as any);
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);

      await service.getSubjectRiskProfile('tenant-1', 'emp-1');

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            subjectId: 'emp-1',
            timestamp: { gte: expect.any(Date) },
          }),
          take: 50,
        }),
      );
    });
  });

  // ─── getRiskHeatmap ──────────────────────────────────────

  describe('getRiskHeatmap', () => {
    it('returns distribution stats and top risks', async () => {
      const mockScores = [
        { subjectId: 'emp-1', subjectType: 'employee', overallScore: 90, domainScores: {}, trajectory: 'accelerating' },
        { subjectId: 'emp-2', subjectType: 'employee', overallScore: 80, domainScores: {}, trajectory: 'stable' },
        { subjectId: 'emp-3', subjectType: 'employee', overallScore: 60, domainScores: {}, trajectory: 'rising' },
        { subjectId: 'emp-4', subjectType: 'employee', overallScore: 40, domainScores: {}, trajectory: 'stable' },
        { subjectId: 'emp-5', subjectType: 'employee', overallScore: 10, domainScores: {}, trajectory: 'declining' },
      ];

      vi.mocked(prisma.riskScore.findMany).mockResolvedValue(mockScores as any);

      const heatmap = await service.getRiskHeatmap('tenant-1');

      expect(heatmap.totalSubjects).toBe(5);
      expect(heatmap.distribution).toEqual({
        critical: 2,  // >= 75
        high: 1,       // 50-74
        medium: 1,     // 25-49
        low: 1,        // < 25
      });

      // Accelerating risks
      expect(heatmap.acceleratingRisks).toHaveLength(1);
      expect(heatmap.acceleratingRisks[0]!.subjectId).toBe('emp-1');
      expect(heatmap.acceleratingRisks[0]!.score).toBe(90);

      // Top risks (ordered by score desc from findMany)
      expect(heatmap.topRisks).toHaveLength(5);
      expect(heatmap.topRisks[0]!.score).toBe(90);
    });

    it('returns empty heatmap when no scores exist', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);

      const heatmap = await service.getRiskHeatmap('tenant-1');

      expect(heatmap.totalSubjects).toBe(0);
      expect(heatmap.distribution).toEqual({
        critical: 0,
        high: 0,
        medium: 0,
        low: 0,
      });
      expect(heatmap.acceleratingRisks).toEqual([]);
      expect(heatmap.topRisks).toEqual([]);
    });

    it('queries distinct latest scores per subject', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([]);

      await service.getRiskHeatmap('tenant-1');

      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { tenantId: 'tenant-1' },
          distinct: ['subjectId'],
          take: 500,
        }),
      );
    });

    it('includes domain scores and trajectory in topRisks', async () => {
      const mockScores = [
        {
          subjectId: 'emp-1',
          subjectType: 'employee',
          overallScore: 90,
          domainScores: { finance: 95, security: 85 },
          trajectory: 'accelerating',
        },
      ];

      vi.mocked(prisma.riskScore.findMany).mockResolvedValue(mockScores as any);

      const heatmap = await service.getRiskHeatmap('tenant-1');

      expect(heatmap.topRisks[0]).toEqual({
        subjectId: 'emp-1',
        subjectType: 'employee',
        score: 90,
        trajectory: 'accelerating',
        domainScores: { finance: 95, security: 85 },
      });
    });
  });
});
