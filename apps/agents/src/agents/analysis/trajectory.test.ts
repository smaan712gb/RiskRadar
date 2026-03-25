import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrajectoryAgent } from './trajectory.agent.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    riskScore: {
      findMany: vi.fn(),
    },
  },
}));

// Mock TrajectoryEngine
vi.mock('../../engine/trajectory-engine.js', () => ({
  TrajectoryEngine: vi.fn().mockImplementation(() => ({
    calculateTrajectory: vi.fn(),
  })),
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
    config: TrajectoryAgent.createConfig(),
    modelRouter: { infer: vi.fn() },
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

describe('TrajectoryAgent', () => {
  let agent: TrajectoryAgent;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(async () => {
    ctx = createMockContext();
    agent = new TrajectoryAgent(ctx as any);
    vi.clearAllMocks();

    // Initialize agent (creates engine instance)
    await (agent as any).onInit();
  });

  describe('createConfig', () => {
    it('returns correct configuration', () => {
      const config = TrajectoryAgent.createConfig();
      expect(config.id).toBe('trajectory-agent');
      expect(config.team).toBe('analysis');
      expect(config.schedule).toBe('30m');
      expect(config.modelTier).toBe('tier1_super');
      expect(config.dataSources).toContain('risk_scores');
      expect(config.dataSources).toContain('signals');
    });
  });

  describe('heartbeat — processes recent subjects', () => {
    it('calculates trajectories for all recent subjects', async () => {
      const recentSubjects = [
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-1' },
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-2' },
        { tenantId: 'tenant-2', subjectType: 'vendor', subjectId: 'vendor-1' },
      ];

      vi.mocked(prisma.riskScore.findMany).mockResolvedValue(recentSubjects as any);

      // Mock engine to return no intervention needed
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'test',
        subjectType: 'employee',
        trajectory: 'stable',
        currentScore: 40,
        projectedScore: 42,
        projectedBreachDate: null,
        trendData: [],
        interventionRecommended: false,
        confidence: 0.8,
      });

      await (agent as any).onHeartbeat();

      // Should query for recent subjects
      expect(prisma.riskScore.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            calculatedAt: { gte: expect.any(Date) },
          }),
          distinct: ['tenantId', 'subjectType', 'subjectId'],
        }),
      );

      // Should calculate trajectory for each subject
      expect(engine.calculateTrajectory).toHaveBeenCalledTimes(3);
      expect(engine.calculateTrajectory).toHaveBeenCalledWith('tenant-1', 'employee', 'emp-1');
      expect(engine.calculateTrajectory).toHaveBeenCalledWith('tenant-2', 'vendor', 'vendor-1');
    });

    it('sends intervention alerts to alert-router when recommended', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-1' },
      ] as any);

      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'emp-1',
        subjectType: 'employee',
        trajectory: 'accelerating',
        currentScore: 72,
        projectedScore: 88,
        projectedBreachDate: '2025-07-15',
        trendData: [],
        interventionRecommended: true,
        confidence: 0.85,
        rateOfChange: 2.3,
      });

      await (agent as any).onHeartbeat();

      // Should send trajectory alert to alert-router
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAgentId: 'trajectory-agent',
          toAgentId: 'alert-router',
          type: 'trajectory_alert',
          payload: expect.objectContaining({
            tenantId: 'tenant-1',
            subjectId: 'emp-1',
            trajectory: 'accelerating',
            currentScore: 72,
            projectedScore: 88,
            interventionRecommended: true,
          }),
        }),
      );
    });

    it('handles calculation errors gracefully per subject', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-1' },
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-2' },
      ] as any);

      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn()
        .mockRejectedValueOnce(new Error('DB connection lost'))
        .mockResolvedValueOnce({
          subjectId: 'emp-2',
          trajectory: 'stable',
          interventionRecommended: false,
          currentScore: 30,
        });

      // Should not throw — errors handled per subject
      await expect((agent as any).onHeartbeat()).resolves.not.toThrow();

      // Second subject should still be processed
      expect(engine.calculateTrajectory).toHaveBeenCalledTimes(2);
    });

    it('does not send alerts for non-intervention results', async () => {
      vi.mocked(prisma.riskScore.findMany).mockResolvedValue([
        { tenantId: 'tenant-1', subjectType: 'employee', subjectId: 'emp-1' },
      ] as any);

      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'emp-1',
        trajectory: 'declining',
        currentScore: 25,
        interventionRecommended: false,
      });

      await (agent as any).onHeartbeat();

      expect(ctx.messageBus.send).not.toHaveBeenCalled();
    });
  });

  describe('high-value signals trigger immediate recalculation', () => {
    it('recalculates trajectory for signal value >= 70', async () => {
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'emp-1',
        trajectory: 'stable',
        currentScore: 50,
        interventionRecommended: false,
      });

      await (agent as any).onSignal({
        tenantId: 'tenant-1',
        subjectType: 'employee',
        subjectId: 'emp-1',
        domain: 'finance',
        signalType: 'large_transaction',
        value: 85,
        timestamp: new Date().toISOString(),
      });

      expect(engine.calculateTrajectory).toHaveBeenCalledWith(
        'tenant-1',
        'employee',
        'emp-1',
      );
    });

    it('sends alert when high-value signal triggers intervention', async () => {
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'emp-1',
        subjectType: 'employee',
        trajectory: 'accelerating',
        currentScore: 80,
        projectedScore: 95,
        projectedBreachDate: '2025-07-01',
        interventionRecommended: true,
        confidence: 0.9,
        rateOfChange: 3.5,
      });

      await (agent as any).onSignal({
        tenantId: 'tenant-1',
        subjectType: 'employee',
        subjectId: 'emp-1',
        domain: 'finance',
        signalType: 'override_transaction',
        value: 90,
        timestamp: new Date().toISOString(),
      });

      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'alert-router',
          type: 'trajectory_alert',
        }),
      );
    });

    it('ignores low-value signals (< 70)', async () => {
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn();

      await (agent as any).onSignal({
        tenantId: 'tenant-1',
        subjectType: 'employee',
        subjectId: 'emp-1',
        domain: 'hr',
        signalType: 'training_completed',
        value: 30,
        timestamp: new Date().toISOString(),
      });

      expect(engine.calculateTrajectory).not.toHaveBeenCalled();
    });

    it('ignores signals with null value', async () => {
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn();

      await (agent as any).onSignal({
        tenantId: 'tenant-1',
        subjectType: 'employee',
        subjectId: 'emp-1',
        domain: 'hr',
        signalType: 'status_change',
        value: null,
        timestamp: new Date().toISOString(),
      });

      expect(engine.calculateTrajectory).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    it('calculates trajectory on calculate_trajectory message', async () => {
      const engine = (agent as any).engine;
      engine.calculateTrajectory = vi.fn().mockResolvedValue({
        subjectId: 'emp-1',
        subjectType: 'employee',
        trajectory: 'stable',
        currentScore: 45,
        interventionRecommended: false,
      });

      await (agent as any).onMessage({
        fromAgentId: 'fusion-engine',
        toAgentId: 'trajectory-agent',
        type: 'calculate_trajectory',
        payload: {
          tenantId: 'tenant-1',
          subjectType: 'employee',
          subjectId: 'emp-1',
        },
        timestamp: new Date(),
      });

      expect(engine.calculateTrajectory).toHaveBeenCalledWith('tenant-1', 'employee', 'emp-1');

      // Should respond to the requesting agent
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          fromAgentId: 'trajectory-agent',
          toAgentId: 'fusion-engine',
          type: 'trajectory_result',
          payload: expect.objectContaining({
            subjectId: 'emp-1',
          }),
        }),
      );
    });
  });
});
