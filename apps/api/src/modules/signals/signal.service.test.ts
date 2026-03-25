import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SignalService } from './signal.service.js';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    signal: {
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      groupBy: vi.fn(),
    },
  },
}));

// Mock queue — getQueue returns a mock queue object
const mockQueueAdd = vi.fn().mockResolvedValue(undefined);
vi.mock('@riskradar/queue', () => ({
  getQueue: vi.fn(() => ({ add: mockQueueAdd })),
  QueueNames: { SIGNAL_INGESTION: 'signal-ingestion' },
}));

// Mock logger
vi.mock('@riskradar/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
}));

// Mock shared
vi.mock('@riskradar/shared', async () => {
  const actual = await vi.importActual('@riskradar/shared') as Record<string, unknown>;
  return {
    ...actual,
    generateId: vi.fn(() => 'batch-abc-123'),
  };
});

const { prisma } = await import('@riskradar/database');
const { getQueue } = await import('@riskradar/queue');

describe('SignalService', () => {
  let service: SignalService;

  beforeEach(() => {
    service = new SignalService();
    vi.clearAllMocks();
  });

  // ─── ingestSignals ───────────────────────────────────────

  describe('ingestSignals', () => {
    const sampleSignals = [
      {
        domain: 'finance',
        signalType: 'override_transaction',
        subjectType: 'employee',
        subjectId: 'emp-1',
        sourceSystem: 'erp',
        value: 50000,
        metadata: { amount: 50000 },
      },
      {
        domain: 'security',
        signalType: 'after_hours_access',
        subjectType: 'employee',
        subjectId: 'emp-1',
        sourceSystem: 'badge-system',
        metadata: { location: 'server-room' },
      },
    ];

    it('persists signals and returns batchId and count', async () => {
      vi.mocked(prisma.signal.createMany).mockResolvedValue({ count: 2 } as any);

      const result = await service.ingestSignals('tenant-1', sampleSignals);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.ingested).toBe(2);
        expect(result.value.batchId).toBe('batch-abc-123');
      }

      expect(prisma.signal.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            tenantId: 'tenant-1',
            domain: 'finance',
            signalType: 'override_transaction',
            subjectId: 'emp-1',
          }),
        ]),
      });
    });

    it('queues signals for async processing', async () => {
      vi.mocked(prisma.signal.createMany).mockResolvedValue({ count: 2 } as any);

      await service.ingestSignals('tenant-1', sampleSignals);

      expect(getQueue).toHaveBeenCalledWith('signal-ingestion');
      expect(mockQueueAdd).toHaveBeenCalledWith(
        'process-signals',
        expect.objectContaining({ tenantId: 'tenant-1', batchId: 'batch-abc-123' }),
      );
    });

    it('handles Redis timeout gracefully — signals still persisted', async () => {
      vi.mocked(prisma.signal.createMany).mockResolvedValue({ count: 2 } as any);
      mockQueueAdd.mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 10)));

      const result = await service.ingestSignals('tenant-1', sampleSignals);

      // Should succeed even though queue timed out
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.ingested).toBe(2);
      }
    });

    it('handles Redis connection failure gracefully', async () => {
      vi.mocked(prisma.signal.createMany).mockResolvedValue({ count: 1 } as any);
      vi.mocked(getQueue).mockImplementation(() => { throw new Error('Redis unavailable'); });

      const result = await service.ingestSignals('tenant-1', [sampleSignals[0]!]);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.ingested).toBe(1);
      }
    });

    it('uses provided timestamp when available', async () => {
      vi.mocked(prisma.signal.createMany).mockResolvedValue({ count: 1 } as any);

      const signalWithTimestamp = [{
        ...sampleSignals[0]!,
        timestamp: '2025-06-15T10:00:00Z',
      }];

      await service.ingestSignals('tenant-1', signalWithTimestamp);

      expect(prisma.signal.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            timestamp: new Date('2025-06-15T10:00:00Z'),
          }),
        ]),
      });
    });
  });

  // ─── querySignals ────────────────────────────────────────

  describe('querySignals', () => {
    it('returns paginated signals', async () => {
      const mockSignals = [
        { id: 'sig-1', domain: 'finance', signalType: 'override_transaction' },
        { id: 'sig-2', domain: 'security', signalType: 'after_hours_access' },
      ];

      vi.mocked(prisma.signal.findMany).mockResolvedValue(mockSignals as any);
      vi.mocked(prisma.signal.count).mockResolvedValue(2);

      const result = await service.querySignals(
        'tenant-1',
        {},
        { page: 1, pageSize: 20 },
      );

      expect(result.signals).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });

    it('applies domain filter', async () => {
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.count).mockResolvedValue(0);

      await service.querySignals(
        'tenant-1',
        { domain: 'finance' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-1', domain: 'finance' }),
        }),
      );
    });

    it('applies time range filtering with from and to', async () => {
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.count).mockResolvedValue(0);

      await service.querySignals(
        'tenant-1',
        { from: '2025-01-01', to: '2025-06-30' },
        { page: 1, pageSize: 10 },
      );

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-06-30'),
            },
          }),
        }),
      );
    });

    it('handles pagination offset correctly', async () => {
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.count).mockResolvedValue(50);

      const result = await service.querySignals(
        'tenant-1',
        {},
        { page: 3, pageSize: 10 },
      );

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 20, take: 10 }),
      );
      expect(result.pagination.totalPages).toBe(5);
      expect(result.pagination.hasNext).toBe(true);
      expect(result.pagination.hasPrev).toBe(true);
    });

    it('applies signalType and subjectId filters together', async () => {
      vi.mocked(prisma.signal.findMany).mockResolvedValue([]);
      vi.mocked(prisma.signal.count).mockResolvedValue(0);

      await service.querySignals(
        'tenant-1',
        { signalType: 'override_transaction', subjectId: 'emp-1' },
        { page: 1, pageSize: 20 },
      );

      expect(prisma.signal.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            signalType: 'override_transaction',
            subjectId: 'emp-1',
          }),
        }),
      );
    });
  });

  // ─── getSignalStats ──────────────────────────────────────

  describe('getSignalStats', () => {
    it('returns aggregated statistics by domain', async () => {
      vi.mocked(prisma.signal.groupBy)
        .mockResolvedValueOnce([
          { domain: 'finance', _count: 15, _avg: { value: 42.5 } },
          { domain: 'security', _count: 8, _avg: { value: 30.0 } },
        ] as any)
        .mockResolvedValueOnce([
          { signalType: 'override_transaction', _count: 10 },
          { signalType: 'after_hours_access', _count: 5 },
        ] as any);
      vi.mocked(prisma.signal.count)
        .mockResolvedValueOnce(23)
        .mockResolvedValueOnce(7);

      const stats = await service.getSignalStats('tenant-1');

      expect(stats.total).toBe(23);
      expect(stats.last24h).toBe(7);
      expect(stats.byDomain).toEqual([
        { domain: 'finance', count: 15, avgValue: 42.5 },
        { domain: 'security', count: 8, avgValue: 30.0 },
      ]);
      expect(stats.topSignalTypes).toEqual([
        { signalType: 'override_transaction', count: 10 },
        { signalType: 'after_hours_access', count: 5 },
      ]);
    });

    it('applies time range filtering when from/to provided', async () => {
      vi.mocked(prisma.signal.groupBy).mockResolvedValue([] as any);
      vi.mocked(prisma.signal.count).mockResolvedValue(0);

      await service.getSignalStats('tenant-1', '2025-01-01', '2025-06-30');

      expect(prisma.signal.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              gte: new Date('2025-01-01'),
              lte: new Date('2025-06-30'),
            },
          }),
        }),
      );
    });

    it('returns empty stats when no signals exist', async () => {
      vi.mocked(prisma.signal.groupBy).mockResolvedValue([] as any);
      vi.mocked(prisma.signal.count).mockResolvedValue(0);

      const stats = await service.getSignalStats('tenant-1');

      expect(stats.total).toBe(0);
      expect(stats.last24h).toBe(0);
      expect(stats.byDomain).toEqual([]);
      expect(stats.topSignalTypes).toEqual([]);
    });
  });
});
