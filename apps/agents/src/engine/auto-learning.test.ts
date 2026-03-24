import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AutoLearningEngine } from './auto-learning.js';

vi.mock('@riskradar/database', () => ({
  prisma: {
    alertFeedback: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    alert: {
      findMany: vi.fn(),
    },
    learningState: {
      upsert: vi.fn(),
    },
    digitalTwin: {
      upsert: vi.fn(),
    },
    signal: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

const { prisma } = await import('@riskradar/database');

describe('AutoLearningEngine', () => {
  let engine: AutoLearningEngine;

  beforeEach(() => {
    engine = new AutoLearningEngine();
    vi.clearAllMocks();
  });

  describe('processAlertFeedback', () => {
    it('stores feedback and returns null with insufficient data', async () => {
      vi.mocked(prisma.alertFeedback.create).mockResolvedValue({} as any);
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue(
        Array(5).fill({ outcome: 'confirmed', compoundScore: 60 }),
      );

      const result = await engine.processAlertFeedback({
        tenantId: 'tenant-1',
        alertId: 'alert-1',
        alertType: 'compound_risk',
        severity: 'high',
        domains: ['finance', 'security'],
        compoundScore: 72,
        outcome: 'confirmed',
        feedbackBy: 'user-1',
      });

      expect(prisma.alertFeedback.create).toHaveBeenCalled();
      expect(result).toBeNull(); // < 10 samples
    });

    it('recommends threshold adjustment when FP rate > 40%', async () => {
      vi.mocked(prisma.alertFeedback.create).mockResolvedValue({} as any);

      // 6 dismissed, 4 confirmed = 60% FP rate
      const feedback = [
        ...Array(6).fill({ outcome: 'dismissed', compoundScore: 35, alertType: 'compound_risk' }),
        ...Array(4).fill({ outcome: 'confirmed', compoundScore: 75, alertType: 'compound_risk' }),
      ];
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue(feedback as any);
      vi.mocked(prisma.learningState.upsert).mockResolvedValue({} as any);

      const result = await engine.processAlertFeedback({
        tenantId: 'tenant-1',
        alertId: 'alert-11',
        alertType: 'compound_risk',
        severity: 'medium',
        domains: ['finance'],
        compoundScore: 45,
        outcome: 'dismissed',
        feedbackBy: 'user-1',
      });

      expect(result).not.toBeNull();
      expect(result!.newThreshold).toBeGreaterThan(result!.previousThreshold);
      expect(result!.reason).toContain('FP rate');
    });
  });

  describe('discoverPatterns', () => {
    it('returns empty for insufficient data', async () => {
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);

      const patterns = await engine.discoverPatterns('tenant-1');
      expect(patterns).toEqual([]);
    });

    it('discovers recurring domain combinations', async () => {
      const alerts = Array(10).fill(null).map((_, i) => ({
        id: `alert-${i}`,
        domains: i < 7 ? ['finance', 'security'] : ['hr', 'communications'],
        alertType: 'compound_risk',
        status: 'confirmed',
        alertSignals: [],
      }));

      vi.mocked(prisma.alert.findMany).mockResolvedValue(alerts as any);

      const patterns = await engine.discoverPatterns('tenant-1');

      expect(patterns.length).toBeGreaterThanOrEqual(1);
      const finSecPattern = patterns.find(
        (p) => p.domainCombination.includes('finance' as any) && p.domainCombination.includes('security' as any),
      );
      expect(finSecPattern).toBeDefined();
      expect(finSecPattern!.frequency).toBe(7);
    });
  });

  describe('checkModelDrift', () => {
    it('returns null with insufficient data', async () => {
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue([]);

      const report = await engine.checkModelDrift('tenant-1');
      expect(report).toBeNull();
    });

    it('detects degrading model quality', async () => {
      // Recent: 80% FP rate
      const recent = [
        ...Array(8).fill({ outcome: 'dismissed' }),
        ...Array(2).fill({ outcome: 'confirmed' }),
      ];
      // Historical: 20% FP rate
      const historical = [
        ...Array(4).fill({ outcome: 'dismissed' }),
        ...Array(16).fill({ outcome: 'confirmed' }),
      ];

      vi.mocked(prisma.alertFeedback.findMany)
        .mockResolvedValueOnce(recent as any)
        .mockResolvedValueOnce(historical as any);

      const report = await engine.checkModelDrift('tenant-1');

      expect(report).not.toBeNull();
      expect(report!.direction).toBe('degrading');
      expect(report!.driftMagnitude).toBeGreaterThan(0.15);
    });
  });
});
