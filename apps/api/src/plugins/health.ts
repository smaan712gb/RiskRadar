import type { FastifyInstance } from 'fastify';
import { prisma } from '@riskradar/database';

/**
 * Production health check endpoints.
 * /health — Basic liveness probe (always returns 200 if process is alive)
 * /ready — Readiness probe (checks DB + Redis connectivity)
 */
export async function registerHealthChecks(app: FastifyInstance): Promise<void> {
  // Liveness — is the process alive?
  app.get('/api/v1/health', {
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string' },
            version: { type: 'string' },
            timestamp: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async () => ({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  // Readiness — can the service handle requests?
  app.get('/api/v1/ready', async (request, reply) => {
    const checks: Record<string, { status: string; latencyMs: number; error?: string }> = {};

    // Database check
    const dbStart = Date.now();
    try {
      await prisma.$queryRaw`SELECT 1`;
      checks['database'] = { status: 'ok', latencyMs: Date.now() - dbStart };
    } catch (error) {
      checks['database'] = {
        status: 'error',
        latencyMs: Date.now() - dbStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    // Redis check
    const redisStart = Date.now();
    try {
      const { getRedisConnection } = await import('@riskradar/queue');
      const redis = getRedisConnection();
      await redis.ping();
      checks['redis'] = { status: 'ok', latencyMs: Date.now() - redisStart };
    } catch (error) {
      checks['redis'] = {
        status: 'error',
        latencyMs: Date.now() - redisStart,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }

    const allHealthy = Object.values(checks).every((c) => c.status === 'ok');
    const statusCode = allHealthy ? 200 : 503;

    return reply.status(statusCode).send({
      status: allHealthy ? 'ready' : 'not_ready',
      timestamp: new Date().toISOString(),
      checks,
    });
  });

  // Metrics endpoint (basic — for monitoring)
  app.get('/api/v1/metrics', async () => {
    const memUsage = process.memoryUsage();
    return {
      uptime: process.uptime(),
      memory: {
        rss: Math.round(memUsage.rss / 1024 / 1024),
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      pid: process.pid,
      nodeVersion: process.version,
    };
  });
}
