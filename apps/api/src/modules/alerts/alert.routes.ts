import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { AlertService } from './alert.service.js';
import {
  updateAlertStatusSchema,
  alertQuerySchema,
  paginationSchema,
  sortSchema,
} from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const alertService = new AlertService();

export async function alertRoutes(app: FastifyInstance): Promise<void> {
  // List alerts
  app.get('/alerts', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;

    const filters = alertQuerySchema.parse(query);
    const pagination = paginationSchema.parse(query);
    const sort = sortSchema.parse(query);

    const result = await alertService.listAlerts(
      user.tenantId,
      filters,
      pagination,
      sort.sortBy ?? 'createdAt',
      sort.sortOrder,
    );

    return reply.send({
      success: true,
      data: result.alerts,
      meta: { pagination: result.pagination },
    });
  });

  // Get alert by ID
  app.get('/alerts/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };

    const alert = await alertService.getAlertById(user.tenantId, id);

    return reply.send({ success: true, data: alert });
  });

  // Update alert status
  app.patch('/alerts/:id/status', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const body = updateAlertStatusSchema.parse(request.body);

    const result = await alertService.updateAlertStatus(user.tenantId, id, body, user.id);

    if (isErr(result)) {
      throw result.error;
    }

    return reply.send({ success: true, data: unwrap(result) });
  });

  // Escalate alert to case
  app.post('/alerts/:id/escalate', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };

    const result = await alertService.escalateToCase(user.tenantId, id, user.id);

    if (isErr(result)) {
      throw result.error;
    }

    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  // Alert statistics
  app.get('/alerts/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };

    const stats = await alertService.getAlertStats(user.tenantId);

    return reply.send({ success: true, data: stats });
  });
}
