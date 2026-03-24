/**
 * Test application factory.
 * Creates a fully configured Fastify instance for integration testing
 * with mocked database and Redis connections.
 */
import Fastify, { type FastifyInstance } from 'fastify';
import jwt from '@fastify/jwt';

let app: FastifyInstance | null = null;

const TEST_JWT_SECRET = 'test-jwt-secret-that-is-at-least-32-characters-long';

export interface TestUser {
  id: string;
  tenantId: string;
  email: string;
  role: string;
  permissions: string[];
}

export const testTenant = {
  id: 'test-tenant-001',
  name: 'Test Bank',
  slug: 'test-bank',
  industry: 'banking',
};

export const testAdmin: TestUser = {
  id: 'test-user-admin',
  tenantId: testTenant.id,
  email: 'admin@test-bank.com',
  role: 'admin',
  permissions: ['alerts.read', 'alerts.write', 'alerts.review', 'alerts.escalate', 'cases.read', 'cases.write', 'cases.assign', 'cases.close', 'signals.read', 'signals.ingest', 'policies.read', 'policies.write', 'audit_logs.read', 'users.read', 'users.write'],
};

export const testAnalyst: TestUser = {
  id: 'test-user-analyst',
  tenantId: testTenant.id,
  email: 'analyst@test-bank.com',
  role: 'analyst',
  permissions: ['alerts.read', 'alerts.write', 'alerts.review', 'cases.read', 'cases.write', 'signals.read'],
};

export const testAuditor: TestUser = {
  id: 'test-user-auditor',
  tenantId: testTenant.id,
  email: 'auditor@test-bank.com',
  role: 'auditor',
  permissions: ['alerts.read', 'cases.read', 'audit_logs.read'],
};

export async function buildTestApp(): Promise<FastifyInstance> {
  if (app) return app;

  app = Fastify({ logger: false });

  await app.register(jwt, { secret: TEST_JWT_SECRET });

  // Auto-verify JWT on all requests and inject user
  app.addHook('preHandler', async (request) => {
    try {
      const decoded = await request.jwtVerify();
      (request as any).user = decoded;
    } catch {
      // Allow unauthenticated for health checks
    }
  });

  // Global error handler
  app.setErrorHandler(async (error, request, reply) => {
    if (error.name === 'NotFoundError' || error.message?.includes('not found')) {
      return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: error.message } });
    }
    if (error.name === 'ZodError' || error.message?.includes('validation')) {
      return reply.status(400).send({ success: false, error: { code: 'VALIDATION_ERROR', message: error.message } });
    }
    if (error.name === 'InvalidStateTransitionError') {
      return reply.status(422).send({ success: false, error: { code: 'INVALID_STATE_TRANSITION', message: error.message } });
    }
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: error.message } });
  });

  // Health endpoint
  app.get('/api/v1/health', async () => ({ status: 'ok' }));

  // Import and register routes
  const { alertRoutes } = await import('../../modules/alerts/alert.routes.js');
  const { caseRoutes } = await import('../../modules/cases/case.routes.js');
  const { signalRoutes } = await import('../../modules/signals/signal.routes.js');
  const { policyRoutes } = await import('../../modules/policies/policy.routes.js');
  const { auditLogRoutes } = await import('../../modules/audit-logs/audit-log.routes.js');

  await app.register(alertRoutes, { prefix: '/api/v1' });
  await app.register(caseRoutes, { prefix: '/api/v1' });
  await app.register(signalRoutes, { prefix: '/api/v1' });
  await app.register(policyRoutes, { prefix: '/api/v1' });
  await app.register(auditLogRoutes, { prefix: '/api/v1' });

  await app.ready();
  return app;
}

export function generateTestToken(user: TestUser): string {
  if (!app) throw new Error('Test app not initialized. Call buildTestApp() first.');
  return app.jwt.sign({
    sub: user.id,
    tenantId: user.tenantId,
    email: user.email,
    role: user.role,
    permissions: user.permissions,
  });
}

export async function closeTestApp(): Promise<void> {
  if (app) {
    await app.close();
    app = null;
  }
}

/**
 * Helper to inject authenticated requests into the test app.
 */
export async function inject(
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  url: string,
  options?: {
    user?: TestUser;
    body?: unknown;
    query?: Record<string, string>;
  },
) {
  const testApp = await buildTestApp();
  const user = options?.user ?? testAdmin;
  const token = generateTestToken(user);

  let fullUrl = url;
  if (options?.query) {
    const params = new URLSearchParams(options.query);
    fullUrl = `${url}?${params.toString()}`;
  }

  const response = await testApp.inject({
    method,
    url: fullUrl,
    headers: {
      authorization: `Bearer ${token}`,
      'content-type': 'application/json',
    },
    payload: options?.body ? JSON.stringify(options.body) : undefined,
  });

  return {
    statusCode: response.statusCode,
    body: JSON.parse(response.body),
    headers: response.headers,
  };
}
