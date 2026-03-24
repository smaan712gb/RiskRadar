import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { CaseService } from './case.service.js';
import { createCaseSchema, updateCaseSchema, caseCommentSchema, paginationSchema, sortSchema } from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const caseService = new CaseService();

export async function caseRoutes(app: FastifyInstance): Promise<void> {
  app.get('/cases', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const sort = sortSchema.parse(query);

    const result = await caseService.listCases(user.tenantId, query, pagination, sort.sortBy ?? 'createdAt', sort.sortOrder);
    return reply.send({ success: true, data: result.cases, meta: { pagination: result.pagination } });
  });

  app.get('/cases/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };
    const caseRecord = await caseService.getCaseById(user.tenantId, id);
    return reply.send({ success: true, data: caseRecord });
  });

  app.post('/cases', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const body = createCaseSchema.parse(request.body);
    const result = await caseService.createCase(user.tenantId, body, user.id);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.patch('/cases/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const body = updateCaseSchema.parse(request.body);
    const result = await caseService.updateCase(user.tenantId, id, body, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });

  app.post('/cases/:id/comments', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const body = caseCommentSchema.parse(request.body);
    const result = await caseService.addComment(user.tenantId, id, body, user.id);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.get('/cases/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const stats = await caseService.getCaseStats(user.tenantId);
    return reply.send({ success: true, data: stats });
  });
}
