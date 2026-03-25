import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SARGeneratorAgent } from './sar-generator.agent.js';

// Mock Prisma (for checkFilingDeadlines which imports prisma dynamically)
vi.mock('@riskradar/database', () => ({
  prisma: {
    sarDraft: {
      findMany: vi.fn(),
    },
    alert: {
      findMany: vi.fn(),
    },
    evidence: {
      findMany: vi.fn(),
    },
  },
}));

// Mock SARGenerator engine
const mockGenerateDraft = vi.fn();
vi.mock('../../engine/sar-generator.js', () => ({
  SARGenerator: vi.fn().mockImplementation(() => ({
    generateDraft: mockGenerateDraft,
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
    config: SARGeneratorAgent.createConfig(),
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

describe('SARGeneratorAgent', () => {
  let agent: SARGeneratorAgent;
  let ctx: ReturnType<typeof createMockContext>;

  beforeEach(async () => {
    ctx = createMockContext();
    agent = new SARGeneratorAgent(ctx as any);
    vi.clearAllMocks();

    // Initialize agent (creates engine instance)
    await (agent as any).onInit();
  });

  describe('createConfig', () => {
    it('returns correct configuration', () => {
      const config = SARGeneratorAgent.createConfig();
      expect(config.id).toBe('sar-generator');
      expect(config.team).toBe('response');
      expect(config.domain).toBe('compliance');
      expect(config.schedule).toBe('1h');
      expect(config.dataSources).toContain('alerts');
      expect(config.dataSources).toContain('evidence');
      expect(config.dataSources).toContain('cases');
    });
  });

  // ─── Message-driven SAR generation ───────────────────────

  describe('generate_sar message', () => {
    it('generates SAR draft and notifies requesting agent', async () => {
      const mockDraft = {
        id: 'sar-draft-1',
        caseId: 'case-1',
        narrative: 'Suspicious activity detected involving multiple override transactions exceeding normal thresholds...',
        filingDeadline: new Date('2025-08-01'),
        status: 'draft',
      };

      mockGenerateDraft.mockResolvedValue(mockDraft);

      await (agent as any).onMessage({
        fromAgentId: 'alert-router',
        toAgentId: 'sar-generator',
        type: 'generate_sar',
        payload: {
          tenantId: 'tenant-1',
          caseId: 'case-1',
          alertIds: ['alert-1', 'alert-2'],
          subjectId: 'emp-1',
          additionalContext: 'Multiple override patterns',
        },
        timestamp: new Date(),
      });

      // Engine should be called
      expect(mockGenerateDraft).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        caseId: 'case-1',
        alertIds: ['alert-1', 'alert-2'],
        subjectId: 'emp-1',
        generatedBy: 'sar-generator-agent',
        additionalContext: 'Multiple override patterns',
      });

      // Should notify requesting agent
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'alert-router',
          type: 'sar_draft_ready',
          payload: expect.objectContaining({
            sarDraftId: 'sar-draft-1',
            caseId: 'case-1',
            status: 'draft',
          }),
        }),
      );

      // Should notify compliance team
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'notification-agent',
          type: 'compliance_notification',
          payload: expect.objectContaining({
            templateId: 'sar_draft_ready',
          }),
        }),
      );
    });
  });

  describe('confirmed_alert auto-drafting', () => {
    it('auto-drafts SAR for high-severity confirmed alerts with score >= 75', async () => {
      mockGenerateDraft.mockResolvedValue({
        id: 'sar-auto-1',
        caseId: 'case-5',
        narrative: 'Auto-generated SAR...',
        filingDeadline: new Date('2025-08-15'),
        status: 'draft',
      });

      await (agent as any).onMessage({
        fromAgentId: 'alert-router',
        toAgentId: 'sar-generator',
        type: 'confirmed_alert',
        payload: {
          tenantId: 'tenant-1',
          alertId: 'alert-10',
          caseId: 'case-5',
          subjectId: 'emp-3',
          severity: 'critical',
          compoundScore: 92,
        },
        timestamp: new Date(),
      });

      expect(mockGenerateDraft).toHaveBeenCalledWith({
        tenantId: 'tenant-1',
        caseId: 'case-5',
        alertIds: ['alert-10'],
        subjectId: 'emp-3',
        generatedBy: 'sar-generator-agent:auto',
      });
    });

    it('skips auto-draft for medium-severity alerts', async () => {
      await (agent as any).onMessage({
        fromAgentId: 'alert-router',
        toAgentId: 'sar-generator',
        type: 'confirmed_alert',
        payload: {
          tenantId: 'tenant-1',
          alertId: 'alert-11',
          caseId: 'case-6',
          subjectId: 'emp-4',
          severity: 'medium',
          compoundScore: 80,
        },
        timestamp: new Date(),
      });

      expect(mockGenerateDraft).not.toHaveBeenCalled();
    });

    it('skips auto-draft when compoundScore < 75', async () => {
      await (agent as any).onMessage({
        fromAgentId: 'alert-router',
        toAgentId: 'sar-generator',
        type: 'confirmed_alert',
        payload: {
          tenantId: 'tenant-1',
          alertId: 'alert-12',
          caseId: 'case-7',
          subjectId: 'emp-5',
          severity: 'high',
          compoundScore: 60,
        },
        timestamp: new Date(),
      });

      expect(mockGenerateDraft).not.toHaveBeenCalled();
    });

    it('skips auto-draft when no caseId provided', async () => {
      await (agent as any).onMessage({
        fromAgentId: 'alert-router',
        toAgentId: 'sar-generator',
        type: 'confirmed_alert',
        payload: {
          tenantId: 'tenant-1',
          alertId: 'alert-13',
          subjectId: 'emp-6',
          severity: 'critical',
          compoundScore: 90,
          // No caseId
        },
        timestamp: new Date(),
      });

      expect(mockGenerateDraft).not.toHaveBeenCalled();
    });
  });

  // ─── Filing deadline monitoring ──────────────────────────

  describe('checkFilingDeadlines (heartbeat)', () => {
    it('sends deadline reminders for approaching SAR drafts', async () => {
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.sarDraft.findMany)
        .mockResolvedValueOnce([
          // Approaching deadline (within 7 days)
          {
            id: 'sar-1',
            caseId: 'case-1',
            tenantId: 'tenant-1',
            filingDeadline: threeDaysFromNow,
          },
        ] as any)
        .mockResolvedValueOnce([] as any); // No overdue

      await (agent as any).onHeartbeat();

      // Should query for approaching deadlines
      expect(prisma.sarDraft.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: 'draft',
            filingDeadline: expect.objectContaining({
              lte: expect.any(Date),
              gte: expect.any(Date),
            }),
          }),
        }),
      );

      // Should send deadline reminder
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'notification-agent',
          type: 'urgent_notification',
          payload: expect.objectContaining({
            templateId: 'sar_deadline_reminder',
            payload: expect.objectContaining({
              sarDraftId: 'sar-1',
              daysRemaining: expect.any(Number),
            }),
          }),
        }),
      );
    });

    it('does not send reminders when no deadlines approaching', async () => {
      vi.mocked(prisma.sarDraft.findMany).mockResolvedValue([] as any);

      await (agent as any).onHeartbeat();

      expect(ctx.messageBus.send).not.toHaveBeenCalled();
    });
  });

  // ─── Overdue draft detection ─────────────────────────────

  describe('overdue draft detection', () => {
    it('sends urgent alerts for overdue SAR drafts', async () => {
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.sarDraft.findMany)
        .mockResolvedValueOnce([] as any) // No approaching deadlines
        .mockResolvedValueOnce([
          // Overdue draft
          {
            id: 'sar-overdue-1',
            caseId: 'case-old',
            tenantId: 'tenant-1',
            filingDeadline: twoDaysAgo,
          },
        ] as any);

      await (agent as any).onHeartbeat();

      // Should send overdue notification
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          toAgentId: 'notification-agent',
          type: 'urgent_notification',
          payload: expect.objectContaining({
            templateId: 'sar_overdue',
            payload: expect.objectContaining({
              sarDraftId: 'sar-overdue-1',
              caseId: 'case-old',
            }),
          }),
        }),
      );
    });

    it('sends alerts for both approaching and overdue drafts', async () => {
      const twoDaysFromNow = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);

      vi.mocked(prisma.sarDraft.findMany)
        .mockResolvedValueOnce([
          { id: 'sar-approaching', caseId: 'case-1', tenantId: 'tenant-1', filingDeadline: twoDaysFromNow },
        ] as any)
        .mockResolvedValueOnce([
          { id: 'sar-overdue', caseId: 'case-2', tenantId: 'tenant-1', filingDeadline: oneDayAgo },
        ] as any);

      await (agent as any).onHeartbeat();

      // Should send 2 notifications — one approaching, one overdue
      expect(ctx.messageBus.send).toHaveBeenCalledTimes(2);

      // Approaching deadline notification
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            templateId: 'sar_deadline_reminder',
          }),
        }),
      );

      // Overdue notification
      expect(ctx.messageBus.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            templateId: 'sar_overdue',
          }),
        }),
      );
    });
  });

  describe('lifecycle', () => {
    it('initializes SARGenerator engine on init', async () => {
      const freshAgent = new SARGeneratorAgent(ctx as any);
      await (freshAgent as any).onInit();

      // Engine should be initialized
      expect((freshAgent as any).engine).toBeDefined();
    });

    it('shuts down cleanly', async () => {
      await expect((agent as any).onShutdown()).resolves.not.toThrow();
    });

    it('ignores direct signal processing', async () => {
      // SAR generation is message-driven, not signal-driven
      await expect(
        (agent as any).onSignal({
          tenantId: 'tenant-1',
          subjectType: 'employee',
          subjectId: 'emp-1',
          domain: 'finance',
          signalType: 'override',
          value: 100,
          timestamp: new Date().toISOString(),
        }),
      ).resolves.not.toThrow();

      // No engine calls or messages
      expect(mockGenerateDraft).not.toHaveBeenCalled();
      expect(ctx.messageBus.send).not.toHaveBeenCalled();
    });
  });
});
