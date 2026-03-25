import { describe, it, expect, beforeEach, vi } from 'vitest';
import { CaseService } from './case.service.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    case: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    alert: { updateMany: vi.fn() },
    caseComment: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Mock audit trail
vi.mock('../../middleware/audit-trail.js', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock shared
vi.mock('@riskradar/shared', async () => {
  const actual = await vi.importActual('@riskradar/shared') as Record<string, unknown>;
  return {
    ...actual,
    CaseSLAHours: { critical: 4, high: 8, medium: 24, low: 72 },
  };
});

const { prisma } = await import('@riskradar/database');
const { createAuditLog } = await import('../../middleware/audit-trail.js');

describe('CaseService', () => {
  let service: CaseService;

  beforeEach(() => {
    service = new CaseService();
    vi.clearAllMocks();
  });

  // ─── listCases ───────────────────────────────────────────

  describe('listCases', () => {
    it('returns paginated cases with includes', async () => {
      const mockCases = [
        { id: 'case-1', title: 'Suspicious Pattern', status: 'open', priority: 'high' },
        { id: 'case-2', title: 'Override Cluster', status: 'open', priority: 'medium' },
      ];

      vi.mocked(prisma.case.findMany).mockResolvedValue(mockCases as any);
      vi.mocked(prisma.case.count).mockResolvedValue(2);

      const result = await service.listCases(
        'tenant-1',
        {},
        { page: 1, pageSize: 20 },
      );

      expect(result.cases).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);

      // Verify includes are requested
      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            assignee: expect.any(Object),
            creator: expect.any(Object),
            _count: expect.any(Object),
          }),
        }),
      );
    });

    it('applies status filter', async () => {
      vi.mocked(prisma.case.findMany).mockResolvedValue([]);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.listCases(
        'tenant-1',
        { status: 'open' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'open' }),
        }),
      );
    });

    it('applies priority filter', async () => {
      vi.mocked(prisma.case.findMany).mockResolvedValue([]);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.listCases(
        'tenant-1',
        { priority: 'critical' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ priority: 'critical' }),
        }),
      );
    });

    it('applies assignedTo filter', async () => {
      vi.mocked(prisma.case.findMany).mockResolvedValue([]);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.listCases(
        'tenant-1',
        { assignedTo: 'user-5' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ assignedTo: 'user-5' }),
        }),
      );
    });

    it('supports custom sort order', async () => {
      vi.mocked(prisma.case.findMany).mockResolvedValue([]);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.listCases(
        'tenant-1',
        {},
        { page: 1, pageSize: 20 },
        'priority',
        'asc',
      );

      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { priority: 'asc' },
        }),
      );
    });

    it('applies multiple filters simultaneously', async () => {
      vi.mocked(prisma.case.findMany).mockResolvedValue([]);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.listCases(
        'tenant-1',
        { status: 'open', priority: 'high', assignedTo: 'user-1' },
        { page: 1, pageSize: 10 },
      );

      expect(prisma.case.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            status: 'open',
            priority: 'high',
            assignedTo: 'user-1',
          }),
        }),
      );
    });
  });

  // ─── getCaseById ─────────────────────────────────────────

  describe('getCaseById', () => {
    it('returns full case with alerts, evidence, and comments', async () => {
      const mockCase = {
        id: 'case-1',
        tenantId: 'tenant-1',
        title: 'Suspicious Override Pattern',
        status: 'open',
        priority: 'high',
        alerts: [{ id: 'alert-1', title: 'Override Alert', severity: 'high' }],
        evidence: [{ id: 'ev-1', type: 'document' }],
        comments: [{ id: 'comment-1', content: 'Initial review', author: { id: 'user-1', name: 'John' } }],
        assignee: { id: 'user-2', name: 'Jane', email: 'jane@example.com' },
        creator: { id: 'user-1', name: 'John' },
      };

      vi.mocked(prisma.case.findFirst).mockResolvedValue(mockCase as any);

      const result = await service.getCaseById('tenant-1', 'case-1');

      expect(result.id).toBe('case-1');
      expect(result.alerts).toHaveLength(1);
      expect(result.evidence).toHaveLength(1);
      expect(result.comments).toHaveLength(1);
      expect(result.assignee.name).toBe('Jane');
    });

    it('throws NotFoundError for missing case', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue(null);

      await expect(
        service.getCaseById('tenant-1', 'nonexistent'),
      ).rejects.toThrow('not found');
    });

    it('scopes lookup to tenant', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue(null);

      await expect(
        service.getCaseById('tenant-1', 'case-1'),
      ).rejects.toThrow();

      expect(prisma.case.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'case-1', tenantId: 'tenant-1' },
        }),
      );
    });
  });

  // ─── createCase ──────────────────────────────────────────

  describe('createCase', () => {
    const createInput = {
      title: 'Suspicious Pattern Detected',
      description: 'Multiple override transactions detected',
      priority: 'high' as const,
      subjectType: 'employee',
      subjectId: 'emp-1',
      alertIds: ['alert-1', 'alert-2'],
      tags: ['fraud', 'override'],
    };

    it('creates case, links alerts, and logs audit', async () => {
      const mockCreated = { id: 'case-new', ...createInput, status: 'open' };

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          case: { create: vi.fn().mockResolvedValue(mockCreated) },
          alert: { updateMany: vi.fn().mockResolvedValue({ count: 2 }) },
        };
        return fn(tx);
      });

      const result = await service.createCase('tenant-1', createInput, 'user-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('case-new');
      }

      // Verify audit log was created
      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: 'tenant-1',
          actorId: 'user-1',
          action: 'case.created',
          resource: 'case',
          resourceId: 'case-new',
        }),
      );
    });

    it('sets SLA deadline based on priority', async () => {
      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          case: {
            create: vi.fn().mockImplementation(({ data }) => {
              // Verify SLA deadline is set — high priority = 8 hours
              const deadline = data.slaDeadline as Date;
              const diff = deadline.getTime() - Date.now();
              const hours = diff / (60 * 60 * 1000);
              expect(hours).toBeGreaterThan(7);
              expect(hours).toBeLessThanOrEqual(8.1);
              return { id: 'case-new', ...data };
            }),
          },
          alert: { updateMany: vi.fn() },
        };
        return fn(tx);
      });

      await service.createCase('tenant-1', createInput, 'user-1');
    });

    it('links alerts to the case within the transaction', async () => {
      const mockUpdateMany = vi.fn().mockResolvedValue({ count: 2 });

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          case: { create: vi.fn().mockResolvedValue({ id: 'case-new' }) },
          alert: { updateMany: mockUpdateMany },
        };
        return fn(tx);
      });

      await service.createCase('tenant-1', createInput, 'user-1');

      expect(mockUpdateMany).toHaveBeenCalledWith({
        where: { id: { in: ['alert-1', 'alert-2'] }, tenantId: 'tenant-1' },
        data: { caseId: 'case-new', status: 'escalated' },
      });
    });

    it('handles empty alertIds without updating alerts', async () => {
      const inputNoAlerts = { ...createInput, alertIds: [] };
      const mockUpdateMany = vi.fn();

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          case: { create: vi.fn().mockResolvedValue({ id: 'case-new' }) },
          alert: { updateMany: mockUpdateMany },
        };
        return fn(tx);
      });

      const result = await service.createCase('tenant-1', inputNoAlerts, 'user-1');

      expect(result.ok).toBe(true);
      expect(mockUpdateMany).not.toHaveBeenCalled();
    });
  });

  // ─── updateCase ──────────────────────────────────────────

  describe('updateCase', () => {
    it('updates case status and logs audit', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
        status: 'open',
      } as any);
      vi.mocked(prisma.case.update).mockResolvedValue({
        id: 'case-1',
        status: 'investigating',
      } as any);

      const result = await service.updateCase(
        'tenant-1',
        'case-1',
        { status: 'investigating' },
        'user-1',
      );

      expect(result.ok).toBe(true);
      expect(prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'case-1' },
          data: expect.objectContaining({ status: 'investigating' }),
        }),
      );

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'case.status_changed',
          details: expect.objectContaining({
            before: { status: 'open' },
            after: { status: 'investigating' },
          }),
        }),
      );
    });

    it('returns error for nonexistent case', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue(null);

      const result = await service.updateCase(
        'tenant-1',
        'nonexistent',
        { status: 'investigating' },
        'user-1',
      );

      expect(result.ok).toBe(false);
    });

    it('updates assignment', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
        status: 'open',
      } as any);
      vi.mocked(prisma.case.update).mockResolvedValue({
        id: 'case-1',
        assignedTo: 'user-5',
      } as any);

      const result = await service.updateCase(
        'tenant-1',
        'case-1',
        { assignedTo: 'user-5' },
        'user-1',
      );

      expect(result.ok).toBe(true);
      expect(prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ assignedTo: 'user-5' }),
        }),
      );
    });

    it('sets resolvedAt when closing a case', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
        status: 'investigating',
      } as any);
      vi.mocked(prisma.case.update).mockResolvedValue({
        id: 'case-1',
        status: 'closed_confirmed',
      } as any);

      await service.updateCase(
        'tenant-1',
        'case-1',
        { status: 'closed_confirmed', resolution: 'Confirmed and filed SAR' },
        'user-1',
      );

      expect(prisma.case.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: 'closed_confirmed',
            resolution: 'Confirmed and filed SAR',
            resolvedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('does not set resolvedAt for non-closing status', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
        status: 'open',
      } as any);
      vi.mocked(prisma.case.update).mockResolvedValue({
        id: 'case-1',
        status: 'investigating',
      } as any);

      await service.updateCase(
        'tenant-1',
        'case-1',
        { status: 'investigating' },
        'user-1',
      );

      const updateCall = vi.mocked(prisma.case.update).mock.calls[0]![0] as any;
      expect(updateCall.data.resolvedAt).toBeUndefined();
    });
  });

  // ─── addComment ──────────────────────────────────────────

  describe('addComment', () => {
    it('creates an internal comment', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
      } as any);
      vi.mocked(prisma.caseComment.create).mockResolvedValue({
        id: 'comment-1',
        caseId: 'case-1',
        content: 'Internal note about review',
        isInternal: true,
      } as any);

      const result = await service.addComment(
        'tenant-1',
        'case-1',
        { content: 'Internal note about review', isInternal: true },
        'user-1',
      );

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.id).toBe('comment-1');
      }

      expect(prisma.caseComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          caseId: 'case-1',
          authorId: 'user-1',
          content: 'Internal note about review',
          isInternal: true,
        }),
      });
    });

    it('creates an external comment', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
      } as any);
      vi.mocked(prisma.caseComment.create).mockResolvedValue({
        id: 'comment-2',
        isInternal: false,
      } as any);

      const result = await service.addComment(
        'tenant-1',
        'case-1',
        { content: 'Public update', isInternal: false },
        'user-1',
      );

      expect(result.ok).toBe(true);
      expect(prisma.caseComment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ isInternal: false }),
      });
    });

    it('returns error for nonexistent case', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue(null);

      const result = await service.addComment(
        'tenant-1',
        'nonexistent',
        { content: 'Comment', isInternal: false },
        'user-1',
      );

      expect(result.ok).toBe(false);
    });

    it('logs audit entry for comment', async () => {
      vi.mocked(prisma.case.findFirst).mockResolvedValue({
        id: 'case-1',
        tenantId: 'tenant-1',
      } as any);
      vi.mocked(prisma.caseComment.create).mockResolvedValue({
        id: 'comment-1',
      } as any);

      await service.addComment(
        'tenant-1',
        'case-1',
        { content: 'Some comment', isInternal: true },
        'user-1',
      );

      expect(createAuditLog).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'case.comment_added',
          details: expect.objectContaining({
            commentId: 'comment-1',
            isInternal: true,
          }),
        }),
      );
    });
  });

  // ─── getCaseStats ────────────────────────────────────────

  describe('getCaseStats', () => {
    it('returns aggregated statistics', async () => {
      vi.mocked(prisma.case.groupBy)
        .mockResolvedValueOnce([
          { status: 'open', _count: 5 },
          { status: 'investigating', _count: 3 },
          { status: 'closed_confirmed', _count: 10 },
        ] as any)
        .mockResolvedValueOnce([
          { priority: 'critical', _count: 2 },
          { priority: 'high', _count: 6 },
          { priority: 'medium', _count: 10 },
        ] as any);
      vi.mocked(prisma.case.count)
        .mockResolvedValueOnce(18)
        .mockResolvedValueOnce(4);

      const stats = await service.getCaseStats('tenant-1');

      expect(stats.total).toBe(18);
      expect(stats.overdue).toBe(4);
      expect(stats.byStatus).toEqual({
        open: 5,
        investigating: 3,
        closed_confirmed: 10,
      });
      expect(stats.byPriority).toEqual({
        critical: 2,
        high: 6,
        medium: 10,
      });
    });

    it('returns zero counts when no cases exist', async () => {
      vi.mocked(prisma.case.groupBy).mockResolvedValue([] as any);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      const stats = await service.getCaseStats('tenant-1');

      expect(stats.total).toBe(0);
      expect(stats.overdue).toBe(0);
      expect(stats.byStatus).toEqual({});
      expect(stats.byPriority).toEqual({});
    });

    it('queries overdue cases with correct criteria', async () => {
      vi.mocked(prisma.case.groupBy).mockResolvedValue([] as any);
      vi.mocked(prisma.case.count).mockResolvedValue(0);

      await service.getCaseStats('tenant-1');

      // Second count call should filter for overdue
      const countCalls = vi.mocked(prisma.case.count).mock.calls;
      expect(countCalls[1]![0]).toEqual(
        expect.objectContaining({
          where: expect.objectContaining({
            tenantId: 'tenant-1',
            slaDeadline: { lt: expect.any(Date) },
            status: { notIn: ['closed_confirmed', 'closed_false_positive', 'closed_no_action'] },
          }),
        }),
      );
    });
  });
});
