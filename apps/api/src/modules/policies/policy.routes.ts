import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { PolicyService } from './policy.service.js';
import { createPolicySchema, paginationSchema } from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const policyService = new PolicyService();

export async function policyRoutes(app: FastifyInstance): Promise<void> {
  app.get('/policies', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const filters = {
      domain: query['domain'],
      policyType: query['policyType'],
      isActive: query['isActive'] === 'false' ? false : query['isActive'] === 'true' ? true : undefined,
    };
    const result = await policyService.listPolicies(user.tenantId, filters, pagination);
    return reply.send({ success: true, data: result.policies, meta: { pagination: result.pagination } });
  });

  app.get('/policies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };
    const policy = await policyService.getPolicyById(user.tenantId, id);
    return reply.send({ success: true, data: policy });
  });

  app.post('/policies', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const body = createPolicySchema.parse(request.body);
    const result = await policyService.createPolicy(user.tenantId, body, user.id);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.put('/policies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const body = request.body as Record<string, unknown>;
    const result = await policyService.updatePolicy(user.tenantId, id, body, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });

  app.post('/policies/:id/approve', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const result = await policyService.approvePolicy(user.tenantId, id, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });

  app.delete('/policies/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const result = await policyService.deactivatePolicy(user.tenantId, id, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });
}
