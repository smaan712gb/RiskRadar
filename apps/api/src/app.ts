import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { createLogger } from '@riskradar/logger';
import { getConfig } from './config/index.js';
import { errorHandler } from './middleware/error-handler.js';
import { registerRequestContext } from './middleware/request-context.js';

export async function buildApp(): Promise<FastifyInstance> {
  const config = getConfig();
  const logger = createLogger('api');

  const app = Fastify({
    logger: {
      level: config.LOG_LEVEL,
      transport:
        config.NODE_ENV !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true, translateTime: 'SYS:standard' } }
          : undefined,
    },
    requestId: 'x-request-id',
    genReqId: () => crypto.randomUUID(),
    trustProxy: true,
  });

  // Error handler
  app.setErrorHandler(errorHandler);

  // Request context (AsyncLocalStorage)
  await registerRequestContext(app);

  // Security
  await app.register(helmet, {
    contentSecurityPolicy: config.NODE_ENV === 'production',
  });

  await app.register(cors, {
    origin: config.NODE_ENV === 'production' ? false : true,
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
    // TODO: Check DB and Redis connectivity
    return { status: 'ready' };
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

  // Public routes (no auth required)
  await app.register(authRoutes, { prefix: '/api/v1' });
  await app.register(billingRoutes, { prefix: '/api/v1' });

  // Protected routes
  await app.register(alertRoutes, { prefix: '/api/v1' });
  await app.register(caseRoutes, { prefix: '/api/v1' });
  await app.register(signalRoutes, { prefix: '/api/v1' });
  await app.register(riskScoreRoutes, { prefix: '/api/v1' });
  await app.register(policyRoutes, { prefix: '/api/v1' });
  await app.register(integrationRoutes, { prefix: '/api/v1' });
  await app.register(userRoutes, { prefix: '/api/v1' });
  await app.register(auditLogRoutes, { prefix: '/api/v1' });

  return app;
}
