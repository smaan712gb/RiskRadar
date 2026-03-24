import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { RiskScoreService } from './risk-score.service.js';
import { paginationSchema } from '@riskradar/shared';

const riskScoreService = new RiskScoreService();

export async function riskScoreRoutes(app: FastifyInstance): Promise<void> {
  app.get('/risk-scores', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const filters = {
      subjectType: query['subjectType'],
      minScore: query['minScore'] ? Number(query['minScore']) : undefined,
      trajectory: query['trajectory'],
    };
    const result = await riskScoreService.listRiskScores(user.tenantId, filters, pagination);
    return reply.send({ success: true, data: result.scores, meta: { pagination: result.pagination } });
  });

  app.get('/risk-scores/heatmap', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const heatmap = await riskScoreService.getRiskHeatmap(user.tenantId);
    return reply.send({ success: true, data: heatmap });
  });

  app.get('/risk-scores/:subjectId', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { subjectId } = request.params as { subjectId: string };
    const profile = await riskScoreService.getSubjectRiskProfile(user.tenantId, subjectId);
    return reply.send({ success: true, data: profile });
  });
}
