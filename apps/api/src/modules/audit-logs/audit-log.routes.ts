import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@riskradar/database';
import { paginationSchema, dateRangeSchema } from '@riskradar/shared';
import { buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';

export async function auditLogRoutes(app: FastifyInstance): Promise<void> {
  // Audit logs are READ-ONLY and IMMUTABLE
  app.get('/audit-logs', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const dateRange = dateRangeSchema.parse(query);

    const where = {
      tenantId: user.tenantId,
      ...(query['actorId'] && { actorId: query['actorId'] }),
      ...(query['actorType'] && { actorType: query['actorType'] }),
      ...(query['action'] && { action: query['action'] }),
      ...(query['resource'] && { resource: query['resource'] }),
      ...(query['resourceId'] && { resourceId: query['resourceId'] }),
      ...(dateRange.from || dateRange.to
        ? {
            timestamp: {
              ...(dateRange.from && { gte: new Date(dateRange.from) }),
              ...(dateRange.to && { lte: new Date(dateRange.to) }),
            },
          }
        : {}),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        ...buildPrismaSkipTake(pagination),
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    return reply.send({
      success: true,
      data: logs,
      meta: { pagination: buildPaginationMeta(total, pagination) },
    });
  });

  // Export audit logs (for regulatory examinations)
  app.get('/audit-logs/export', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const dateRange = dateRangeSchema.parse(query);

    const where = {
      tenantId: user.tenantId,
      ...(dateRange.from || dateRange.to
        ? {
            timestamp: {
              ...(dateRange.from && { gte: new Date(dateRange.from) }),
              ...(dateRange.to && { lte: new Date(dateRange.to) }),
            },
          }
        : {}),
    };

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'asc' },
      take: 50000, // Max 50K records per export
    });

    reply.header('Content-Type', 'application/json');
    reply.header('Content-Disposition', `attachment; filename="audit-logs-${new Date().toISOString().split('T')[0]}.json"`);

    return reply.send({
      exportedAt: new Date().toISOString(),
      tenantId: user.tenantId,
      recordCount: logs.length,
      logs,
    });
  });
}
