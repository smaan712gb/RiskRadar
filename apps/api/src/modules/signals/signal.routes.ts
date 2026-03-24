import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SignalService } from './signal.service.js';
import { signalBatchIngestionSchema, signalQuerySchema, paginationSchema } from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const signalService = new SignalService();

export async function signalRoutes(app: FastifyInstance): Promise<void> {
  app.post('/signals/ingest', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const body = signalBatchIngestionSchema.parse(request.body);
    const result = await signalService.ingestSignals(user.tenantId, body.signals);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.get('/signals', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const filters = signalQuerySchema.parse(query);
    const pagination = paginationSchema.parse(query);
    const result = await signalService.querySignals(user.tenantId, filters, pagination);
    return reply.send({ success: true, data: result.signals, meta: { pagination: result.pagination } });
  });

  app.get('/signals/stats', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { from, to } = request.query as { from?: string; to?: string };
    const stats = await signalService.getSignalStats(user.tenantId, from, to);
    return reply.send({ success: true, data: stats });
  });
}
