import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BiasCheckAgent } from './bias-check.agent.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    alert: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
    },
    riskScore: {
      groupBy: vi.fn(),
      aggregate: vi.fn(),
    },
    alertFeedback: {
      findMany: vi.fn(),
      groupBy: vi.fn(),
    },
    case: {
      groupBy: vi.fn(),
    },
  },
}));

// Mock logger
vi.mock('@riskradar/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  })),
}));

const { prisma } = await import('@riskradar/database');

function createMockContext() {
  return {
    tenantId: 'tenant-1',
    config: BiasCheckAgent.createConfig(),
    modelRouter: {
      infer: vi.fn().mockResolvedValue({
        content: JSON.stringify({
          biasDetected: false,
          biasType: 'none',
          severity: 'none',
          findings: [],
          recommendations: [],
          fairnessScore: 85,
        }),
        reasoning: 'No bias detected',
        tier: 'tier2_cascade',
        modelId: 'test-model',
        tokensUsed: 500,
        latencyMs: 1000,
        cached: false,
      }),
    },
    messageBus: {
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
      send: vi.fn().mockResolvedValue(undefined),
      broadcastToTeam: vi.fn().mockResolvedValue(undefined),
      publishSignal: vi.fn().mockResolvedValue(undefined),
    },
    logger: {
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
      debug: vi.fn(),
    },
  };
}

describe('BiasCheckAgent', () => {
  let agent: BiasCheckAgent;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(() => {
    ctx = createMockContext();
    agent = new BiasCheckAgent(ctx as any);
    vi.clearAllMocks();
  });

  describe('createConfig', () => {
    it('returns correct agent configuration', () => {
      const config = BiasCheckAgent.createConfig();
      expect(config.id).toBe('bias-check');
      expect(config.team).toBe('analysis');
      expect(config.domain).toBe('compliance');
      expect(config.schedule).toBe('6h');
      expect(config.enabled).toBe(true);
    });
  });

  describe('distribution check — detects alert concentration', () => {
    it('detects when a subject has disproportionate alert volume', async () => {
      // Set up: one subject has > 15% of all alerts
      vi.mocked(prisma.alert.groupBy).mockResolvedValue([
        { subjectId: 'emp-1', _count: 20, _avg: { compoundScore: 65 } },
        { subjectId: 'emp-2', _count: 5, _avg: { compoundScore: 40 } },
        { subjectId: 'emp-3', _count: 3, _avg: { compoundScore: 30 } },
        { subjectId: 'emp-4', _count: 2, _avg: { compoundScore: 25 } },
      ] as any);

      vi.mocked(prisma.riskScore.groupBy).mockResolvedValue([
        { subjectType: 'employee', _count: 100, _avg: { overallScore: 45 }, _max: { overallScore: 90 }, _min: { overallScore: 10 } },
      ] as any);

      // Initialize and run heartbeat
      await agent.start();

      // The heartbeat runs on interval, so we trigger it directly via the protected method
      // We access it through the agent's onHeartbeat by calling start and then simulating
      // Since onHeartbeat is protected, we test through message handling or direct invocation
      // We'll call the internal method via (agent as any)
      await (agent as any).runDistributionCheck();

      // Verify concentration was detected and broadcast
      expect(ctx.messageBus.broadcastToTeam).toHaveBeenCalledWith(
        'response',
        expect.objectContaining({
          fromAgentId: 'bias-check',
          type: 'bias_alert',
          payload: expect.objectContaining({
            type: 'concentration',
            severity: 'medium',
          }),
        }),
      );
    });

    it('does not broadcast when no concentration detected', async () => {
      // Even distribution — no subject > 15%
      vi.mocked(prisma.alert.groupBy).mockResolvedValue([
        { subjectId: 'emp-1', _count: 3, _avg: { compoundScore: 50 } },
        { subjectId: 'emp-2', _count: 3, _avg: { compoundScore: 40 } },
        { subjectId: 'emp-3', _count: 3, _avg: { compoundScore: 30 } },
        { subjectId: 'emp-4', _count: 3, _avg: { compoundScore: 35 } },
        { subjectId: 'emp-5', _count: 3, _avg: { compoundScore: 45 } },
        { subjectId: 'emp-6', _count: 3, _avg: { compoundScore: 42 } },
        { subjectId: 'emp-7', _count: 3, _avg: { compoundScore: 38 } },
      ] as any);

      vi.mocked(prisma.riskScore.groupBy).mockResolvedValue([
        { subjectType: 'employee', _count: 50, _avg: { overallScore: 35 }, _max: { overallScore: 60 }, _min: { overallScore: 10 } },
      ] as any);

      await (agent as any).runDistributionCheck();

      expect(ctx.messageBus.broadcastToTeam).not.toHaveBeenCalled();
    });
  });

  describe('weekly parity analysis', () => {
    it('runs AI-driven parity analysis with sufficient data', async () => {
      // Provide 10+ alerts to trigger analysis
      const recentAlerts = Array.from({ length: 15 }, (_, i) => ({
        id: `alert-${i}`,
        subjectId: `emp-${i % 5}`,
        severity: i < 5 ? 'high' : 'medium',
        status: 'new',
        compoundScore: 50 + i,
        domains: ['finance', 'security'],
      }));

      vi.mocked(prisma.alert.findMany).mockResolvedValue(recentAlerts as any);
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue([
        { alertId: 'alert-0', feedbackType: 'review', wasAccurate: true },
        { alertId: 'alert-1', feedbackType: 'review', wasAccurate: false },
      ] as any);

      await (agent as any).runWeeklyParityAnalysis();

      // Should invoke the model router for AI analysis
      expect(ctx.modelRouter.infer).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('Analyze this alert distribution'),
          requireReasoning: true,
        }),
      );
    });

    it('broadcasts bias alert when bias is detected', async () => {
      const recentAlerts = Array.from({ length: 12 }, (_, i) => ({
        id: `alert-${i}`,
        subjectId: `emp-${i % 3}`,
        severity: 'high',
        status: 'new',
        compoundScore: 70,
        domains: ['finance'],
      }));

      vi.mocked(prisma.alert.findMany).mockResolvedValue(recentAlerts as any);
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue([]);

      // Mock AI response indicating bias detected
      ctx.modelRouter.infer.mockResolvedValue({
        content: JSON.stringify({
          biasDetected: true,
          biasType: 'domain_skew',
          severity: 'medium',
          findings: ['Finance domain over-represented'],
          recommendations: ['Review domain weighting'],
          fairnessScore: 55,
        }),
        reasoning: 'Domain skew detected',
        tier: 'tier2_cascade',
        modelId: 'test',
        tokensUsed: 500,
        latencyMs: 1000,
        cached: false,
      });

      await (agent as any).runWeeklyParityAnalysis();

      // Should broadcast bias alert
      expect(ctx.messageBus.broadcastToTeam).toHaveBeenCalledWith(
        'response',
        expect.objectContaining({
          type: 'bias_alert',
          payload: expect.objectContaining({
            type: 'parity_violation',
            severity: 'medium',
          }),
        }),
      );

      // Should notify compliance
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'notification-agent',
          type: 'compliance_notification',
        }),
      );
    });

    it('skips analysis when fewer than 10 alerts', async () => {
      vi.mocked(prisma.alert.findMany).mockResolvedValue([
        { id: 'alert-1', subjectId: 'emp-1', severity: 'high', status: 'new', compoundScore: 70, domains: ['finance'] },
      ] as any);
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue([]);

      await (agent as any).runWeeklyParityAnalysis();

      // Model should not be invoked with too few alerts
      expect(ctx.modelRouter.infer).not.toHaveBeenCalled();
    });
  });

  describe('quarterly fairness audit', () => {
    it('generates comprehensive audit report', async () => {
      vi.mocked(prisma.alert.groupBy).mockResolvedValue([
        { severity: 'high', status: 'new', _count: 10 },
        { severity: 'medium', status: 'resolved', _count: 20 },
      ] as any);
      vi.mocked(prisma.case.groupBy).mockResolvedValue([
        { status: 'open', priority: 'high', _count: 5 },
      ] as any);
      vi.mocked(prisma.alertFeedback.groupBy).mockResolvedValue([
        { feedbackType: 'accurate', _count: 15 },
        { feedbackType: 'false_positive', _count: 3 },
      ] as any);
      vi.mocked(prisma.riskScore.aggregate).mockResolvedValue({
        _avg: { overallScore: 42.5 },
        _count: 500,
        _max: { overallScore: 95 },
        _min: { overallScore: 5 },
      } as any);

      // Mock AI audit response
      ctx.modelRouter.infer.mockResolvedValue({
        content: JSON.stringify({
          overallFairnessScore: 78,
          grade: 'B',
          dimensions: [
            { name: 'Disparate Impact', score: 80, status: 'pass', findings: 'Within acceptable range' },
          ],
          strengths: ['Low false positive rate'],
          weaknesses: ['Limited feedback data'],
          recommendations: [
            { priority: 'medium', action: 'Collect more feedback', rationale: 'Improves calibration' },
          ],
          complianceNotes: 'Meets basic fairness requirements',
        }),
        reasoning: 'Comprehensive audit analysis',
        tier: 'tier2_cascade',
        modelId: 'test',
        tokensUsed: 2000,
        latencyMs: 3000,
        cached: false,
      });

      await (agent as any).runQuarterlyFairnessAudit();

      // Should invoke AI for audit
      expect(ctx.modelRouter.infer).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.stringContaining('quarterly fairness audit'),
          requireReasoning: true,
          maxTokens: 4096,
        }),
      );

      // Should broadcast audit results
      expect(ctx.messageBus.broadcastToTeam).toHaveBeenCalledWith(
        'response',
        expect.objectContaining({
          type: 'quarterly_fairness_audit',
          payload: expect.objectContaining({
            report: expect.objectContaining({
              overallFairnessScore: 78,
              grade: 'B',
            }),
            period: '90d',
          }),
        }),
      );

      // Should send notification
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'notification-agent',
          type: 'compliance_notification',
          payload: expect.objectContaining({
            templateId: 'quarterly_fairness_audit',
          }),
        }),
      );
    });

    it('handles AI parse failure gracefully', async () => {
      vi.mocked(prisma.alert.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.case.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.alertFeedback.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.aggregate).mockResolvedValue({
        _avg: { overallScore: null },
        _count: 0,
        _max: { overallScore: null },
        _min: { overallScore: null },
      } as any);

      // Mock AI returning unparseable content
      ctx.modelRouter.infer.mockResolvedValue({
        content: 'This is not valid JSON',
        reasoning: 'Reasoning text',
        tier: 'tier2_cascade',
        modelId: 'test',
        tokensUsed: 100,
        latencyMs: 500,
        cached: false,
      });

      // Should not throw
      await expect(
        (agent as any).runQuarterlyFairnessAudit(),
      ).resolves.not.toThrow();

      // Should still broadcast with fallback report
      expect(ctx.messageBus.broadcastToTeam).toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('triggers fairness audit on run_fairness_audit message', async () => {
      vi.mocked(prisma.alert.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.case.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.alertFeedback.groupBy).mockResolvedValue([]);
      vi.mocked(prisma.riskScore.aggregate).mockResolvedValue({
        _avg: { overallScore: null }, _count: 0,
        _max: { overallScore: null }, _min: { overallScore: null },
      } as any);

      await (agent as any).onMessage({
        fromAgentId: 'test-agent',
        toAgentId: 'bias-check',
        type: 'run_fairness_audit',
        payload: {},
        timestamp: new Date(),
      });

      // AI should be invoked for quarterly audit
      expect(ctx.modelRouter.infer).toHaveBeenCalled();
    });

    it('triggers parity check on run_parity_check message', async () => {
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
      vi.mocked(prisma.alertFeedback.findMany).mockResolvedValue([]);

      await (agent as any).onMessage({
        fromAgentId: 'test-agent',
        toAgentId: 'bias-check',
        type: 'run_parity_check',
        payload: {},
        timestamp: new Date(),
      });

      // Even though no alerts exist, the method should run without error
      expect(ctx.modelRouter.infer).not.toHaveBeenCalled(); // < 10 alerts
    });
  });
});
