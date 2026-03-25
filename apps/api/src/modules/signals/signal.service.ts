import { prisma } from '@riskradar/database';
import { getQueue, QueueNames, type SignalIngestionJob } from '@riskradar/queue';
import { type Result, ok, generateId } from '@riskradar/shared';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';

export class SignalService {
  async ingestSignals(
    tenantId: string,
    signals: Array<{
      domain: string;
      signalType: string;
      subjectType: string;
      subjectId: string;
      sourceSystem: string;
      value?: number;
      metadata: Record<string, unknown>;
      timestamp?: string;
    }>,
  ): Promise<Result<{ ingested: number; batchId: string }, Error>> {
    const batchId = generateId();
    const now = new Date();

    const records = signals.map((s) => ({
      tenantId,
      domain: s.domain,
      signalType: s.signalType,
      subjectType: s.subjectType,
      subjectId: s.subjectId,
      sourceSystem: s.sourceSystem,
      value: s.value ?? null,
      metadata: s.metadata as any,
      timestamp: s.timestamp ? new Date(s.timestamp) : now,
      normalizedAt: now,
    }));

    const created = await prisma.signal.createMany({ data: records as any });

    // Queue for async processing — graceful if Redis unavailable
    try {
      const queue = getQueue(QueueNames.SIGNAL_INGESTION);
      await Promise.race([
        queue.add('process-signals', { tenantId, signals: [], batchId } as SignalIngestionJob),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 3000)),
      ]);
    } catch (error) {
      // Redis unavailable — signals persisted in DB, queue skipped
      const { logger } = await import('@riskradar/logger');
      logger.warn({ error, batchId }, 'Signal queue unavailable — signals persisted in DB, async processing skipped');
    }

    return ok({ ingested: created.count, batchId });
  }

  async querySignals(
    tenantId: string,
    filters: {
      domain?: string;
      signalType?: string;
      subjectId?: string;
      from?: string;
      to?: string;
    },
    pagination: PaginationOptions,
  ) {
    const where = {
      tenantId,
      ...(filters.domain && { domain: filters.domain }),
      ...(filters.signalType && { signalType: filters.signalType }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.from || filters.to
        ? {
            timestamp: {
              ...(filters.from && { gte: new Date(filters.from) }),
              ...(filters.to && { lte: new Date(filters.to) }),
            },
          }
        : {}),
    };

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        ...buildPrismaSkipTake(pagination),
      }),
      prisma.signal.count({ where }),
    ]);

    return { signals, pagination: buildPaginationMeta(total, pagination) };
  }

  async getSignalStats(
    tenantId: string,
    from?: string,
    to?: string,
  ) {
    const where = {
      tenantId,
      ...(from || to
        ? {
            timestamp: {
              ...(from && { gte: new Date(from) }),
              ...(to && { lte: new Date(to) }),
            },
          }
        : {}),
    };

    const [byDomain, bySignalType, total, last24h] = await Promise.all([
      prisma.signal.groupBy({ by: ['domain'], where, _count: true, _avg: { value: true } }),
      prisma.signal.groupBy({ by: ['signalType'], where, _count: true, orderBy: { _count: { signalType: 'desc' } }, take: 20 }),
      prisma.signal.count({ where }),
      prisma.signal.count({
        where: { ...where, timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
      }),
    ]);

    return {
      total,
      last24h,
      byDomain: byDomain.map((d) => ({ domain: d.domain, count: d._count, avgValue: d._avg.value })),
      topSignalTypes: bySignalType.map((s) => ({ signalType: s.signalType, count: s._count })),
    };
  }
}
