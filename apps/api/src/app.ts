import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { getConfig } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRequestContext } from './middleware/request-context.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = getConfig();

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
    },
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  });

  // Error handler
  app.setErrorHandler(errorHandler as any);

  // Request context (AsyncLocalStorage)
  await registerRequestContext(app as any);

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: config.NODE_ENV === 'production'
      ? (process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()) ?? [])
      : true,
    credentials: true,
  });

  await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    keyGenerator: (request) => {
      return request.headers['x-forwarded-for'] as string ?? request.ip;
    },
  });

  // JWT
  await app.register(jwt, {
    secret: config.JWT_SECRET,
    sign: { expiresIn: config.JWT_ACCESS_EXPIRY },
  });

  // API Documentation
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'RiskRadar API',
        description: 'AI-driven organizational risk intelligence platform',
        version: '0.1.0',
      },
      servers: [
        { url: `http://localhost:${config.API_PORT}`, description: 'Development' },
      ],
      components: {
        securitySchemes: {
          Bearer: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
      security: [{ Bearer: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });

  // Health check
  app.get('/api/v1/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));

  app.get('/api/v1/ready', async () => {
    const checks: Record<string, string> = {};

    // Check database connectivity
    try {
      const { prisma } = await import('@riskradar/database');
      await prisma.$queryRaw`SELECT 1`;
      checks.database = 'ok';
    } catch {
      checks.database = 'unavailable';
    }

    // Check Redis connectivity
    try {
      const { getRedisConnection } = await import('@riskradar/queue');
      const redis = getRedisConnection();
      await redis.ping();
      checks.redis = 'ok';
    } catch {
      checks.redis = 'unavailable';
    }

    const allHealthy = Object.values(checks).every((v) => v === 'ok');
    return { status: allHealthy ? 'ready' : 'degraded', checks };
  });

  // Route modules
  const { alertRoutes } = await import('./modules/alerts/alert.routes.js');
  const { caseRoutes } = await import('./modules/cases/case.routes.js');
  const { signalRoutes } = await import('./modules/signals/signal.routes.js');
  const { riskScoreRoutes } = await import('./modules/risk-scores/risk-score.routes.js');
  const { policyRoutes } = await import('./modules/policies/policy.routes.js');
  const { integrationRoutes } = await import('./modules/integrations/integration.routes.js');
  const { userRoutes } = await import('./modules/users/user.routes.js');
  const { auditLogRoutes } = await import('./modules/audit-logs/audit-log.routes.js');
  const { authRoutes } = await import('./modules/auth/auth.routes.js');
  const { billingRoutes } = await import('./modules/billing/billing.routes.js');
  const { regulatoryPipelineRoutes } = await import('./modules/policies/regulatory-pipeline.routes.js');

  // JWT auth hook — applies to all /api/v1 routes EXCEPT public ones
  const publicPaths = ['/api/v1/auth/', '/api/v1/billing/webhook', '/api/v1/health', '/api/v1/ready'];

  app.addHook('onRequest', async (request, reply) => {
    const path = request.url.split('?')[0] ?? '';

    // Skip auth for public paths
    if (publicPaths.some((p) => path.startsWith(p)) || !path.startsWith('/api/v1/')) {
      return;
    }

    try {
      const decoded = await request.jwtVerify() as Record<string, unknown>;
      // Map JWT 'sub' claim to 'id' for route handlers
      (request as any).user = { ...decoded, id: decoded['sub'] };
    } catch {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }
  });

  // All routes
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(billingRoutes, { prefix: '/api/v1' });
  await app.register(alertRoutes, { prefix: '/api/v1' });
  await app.register(caseRoutes, { prefix: '/api/v1' });
  await app.register(signalRoutes, { prefix: '/api/v1' });
  await app.register(regulatoryPipelineRoutes, { prefix: '/api/v1' });
  await app.register(riskScoreRoutes, { prefix: '/api/v1' });
  await app.register(policyRoutes, { prefix: '/api/v1' });
  await app.register(integrationRoutes, { prefix: '/api/v1' });
  await app.register(userRoutes, { prefix: '/api/v1' });
  await app.register(auditLogRoutes, { prefix: '/api/v1' });

  return app;
}
