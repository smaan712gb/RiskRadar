import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AlertService } from './alert.service.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    alert: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn(),
    },
    alertSignal: { createMany: vi.fn() },
    evidence: { updateMany: vi.fn() },
    case: { create: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn((fn) => fn({
      case: { create: vi.fn().mockResolvedValue({ id: 'case-1' }) },
      alert: { update: vi.fn() },
      evidence: { updateMany: vi.fn() },
    })),
  },
}));

const { prisma } = await import('@riskradar/database');

describe('AlertService', () => {
  let service: AlertService;

  beforeEach(() => {
    service = new AlertService();
    vi.clearAllMocks();
  });

  describe('listAlerts', () => {
    it('returns paginated alerts', async () => {
      const mockAlerts = [
        { id: 'alert-1', title: 'Test Alert', severity: 'high', status: 'new' },
        { id: 'alert-2', title: 'Test Alert 2', severity: 'medium', status: 'new' },
      ];

      vi.mocked(prisma.alert.findMany).mockResolvedValue(mockAlerts as any);
      vi.mocked(prisma.alert.count).mockResolvedValue(2);

      const result = await service.listAlerts(
        'tenant-1',
        {},
        { page: 1, pageSize: 20 },
      );

      expect(result.alerts).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('applies severity filter', async () => {
      vi.mocked(prisma.alert.findMany).mockResolvedValue([]);
      vi.mocked(prisma.alert.count).mockResolvedValue(0);

      await service.listAlerts(
        'tenant-1',
        { severity: 'critical' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.alert.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ severity: 'critical' }),
        }),
      );
    });
  });

  describe('getAlertById', () => {
    it('returns alert with related data', async () => {
      const mockAlert = {
        id: 'alert-1',
        tenantId: 'tenant-1',
        title: 'Override Pattern Detected',
        severity: 'high',
        compoundScore: 78,
        evidence: [],
        alertSignals: [],
      };

      vi.mocked(prisma.alert.findFirst).mockResolvedValue(mockAlert as any);

      const result = await service.getAlertById('tenant-1', 'alert-1');
      expect(result.id).toBe('alert-1');
      expect(result.compoundScore).toBe(78);
    });

    it('throws NotFoundError for missing alert', async () => {
      vi.mocked(prisma.alert.findFirst).mockResolvedValue(null);

      await expect(
        service.getAlertById('tenant-1', 'nonexistent'),
      ).rejects.toThrow('not found');
    });
  });

  describe('updateAlertStatus', () => {
    it('allows valid state transitions', async () => {
      vi.mocked(prisma.alert.findFirst).mockResolvedValue({
        id: 'alert-1',
        status: 'new',
        tenantId: 'tenant-1',
      } as any);
      vi.mocked(prisma.alert.update).mockResolvedValue({ id: 'alert-1', status: 'under_review' } as any);

      const result = await service.updateAlertStatus(
        'tenant-1',
        'alert-1',
        { status: 'under_review' },
        'user-1',
      );

      expect(result.ok).toBe(true);
    });

    it('rejects invalid state transitions', async () => {
      vi.mocked(prisma.alert.findFirst).mockResolvedValue({
        id: 'alert-1',
        status: 'resolved',
        tenantId: 'tenant-1',
      } as any);

      const result = await service.updateAlertStatus(
        'tenant-1',
        'alert-1',
        { status: 'new' as any },
        'user-1',
      );

      expect(result.ok).toBe(false);
    });
  });

  describe('escalateToCase', () => {
    it('creates case and links alert', async () => {
      vi.mocked(prisma.alert.findFirst).mockResolvedValue({
        id: 'alert-1',
        tenantId: 'tenant-1',
        title: 'Test Alert',
        description: 'Test',
        severity: 'high',
        subjectType: 'employee',
        subjectId: 'emp-1',
      } as any);

      const result = await service.escalateToCase('tenant-1', 'alert-1', 'user-1');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.caseId).toBe('case-1');
      }
    });
  });

  describe('getAlertStats', () => {
    it('returns aggregated statistics', async () => {
      vi.mocked(prisma.alert.groupBy)
        .mockResolvedValueOnce([{ status: 'new', _count: 5 }] as any)
        .mockResolvedValueOnce([{ severity: 'high', _count: 3 }] as any)
        .mockResolvedValueOnce([{ alertType: 'compound_risk', _count: 2 }] as any);
      vi.mocked(prisma.alert.count)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(3);

      const stats = await service.getAlertStats('tenant-1');

      expect(stats.total).toBe(10);
      expect(stats.last24h).toBe(3);
      expect(stats.byStatus).toHaveProperty('new', 5);
    });
  });
});
