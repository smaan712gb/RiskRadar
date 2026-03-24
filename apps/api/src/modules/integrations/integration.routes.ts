import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { IntegrationService } from './integration.service.js';
import { paginationSchema } from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const integrationService = new IntegrationService();

export async function integrationRoutes(app: FastifyInstance): Promise<void> {
  app.get('/integrations', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const result = await integrationService.listIntegrations(user.tenantId, pagination);
    return reply.send({ success: true, data: result.integrations, meta: { pagination: result.pagination } });
  });

  app.get('/integrations/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };
    const integration = await integrationService.getIntegrationById(user.tenantId, id);
    return reply.send({ success: true, data: integration });
  });

  app.post('/integrations', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const body = request.body as Record<string, unknown>;
    const result = await integrationService.createIntegration(user.tenantId, body as any, user.id);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.post('/integrations/:id/test', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };
    const result = await integrationService.testConnection(user.tenantId, id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });

  app.post('/integrations/:id/sync', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const result = await integrationService.triggerSync(user.tenantId, id, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });
}
