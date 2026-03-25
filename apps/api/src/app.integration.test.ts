import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';

// Mock config before anything imports it
vi.mock('./config/index.js', () => ({
  getConfig: vi.fn(() => ({
    NODE_ENV: 'development',
    API_HOST: '0.0.0.0',
    API_PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'test-jwt-secret-must-be-at-least-32-chars!!',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    NEMOCLAW_ENDPOINT: 'http://localhost:8080',
    NEMOTRON_SUPER_MODEL: 'test-model',
    NEMOTRON_CASCADE_MODEL: 'test-model-cascade',
    MODEL_TIMEOUT_MS: 30000,
    PRIVACY_ROUTER_ENABLED: false,
    LOG_LEVEL: 'silent',
    ENCRYPTION_KEY: 'test-encryption-key-must-be-32-chars!!',
  })),
}));

// Mock database
vi.mock('@riskradar/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    tenant: { findFirst: vi.fn() },
    role: { create: vi.fn() },
    user: { create: vi.fn(), findFirst: vi.fn() },
    alert: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn(),
    },
    case: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    signal: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      createMany: vi.fn().mockResolvedValue({ count: 0 }),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    riskScore: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    policy: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
      update: vi.fn(),
    },
    integration: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      create: vi.fn(),
    },
    alertSignal: { createMany: vi.fn() },
    alertFeedback: { findMany: vi.fn().mockResolvedValue([]) },
    evidence: { updateMany: vi.fn() },
    caseComment: { create: vi.fn() },
    sarDraft: { findMany: vi.fn().mockResolvedValue([]) },
    $transaction: vi.fn((fn: any) => fn({
      case: { create: vi.fn().mockResolvedValue({ id: 'case-1' }) },
      alert: { update: vi.fn(), updateMany: vi.fn() },
      evidence: { updateMany: vi.fn() },
      tenant: { create: vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'Test', slug: 'test' }) },
      role: { create: vi.fn() },
      user: { create: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com', name: 'Test', role: 'admin' }) },
      policy: { create: vi.fn().mockResolvedValue({ id: 'policy-1' }) },
    })),
  },
}));

// Mock queue
vi.mock('@riskradar/queue', () => ({
  getQueue: vi.fn(() => ({ add: vi.fn().mockResolvedValue(undefined) })),
  getRedisConnection: vi.fn(() => ({ ping: vi.fn().mockResolvedValue('PONG') })),
  QueueNames: { SIGNAL_INGESTION: 'signal-ingestion' },
}));

// Mock logger
vi.mock('@riskradar/logger', () => ({
  logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() },
  createLogger: vi.fn(() => ({
    warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn(), fatal: vi.fn(),
  })),
}));

// Mock shared
vi.mock('@riskradar/shared', async () => {
  const actual = await vi.importActual('@riskradar/shared') as Record<string, unknown>;
  return {
    ...actual,
    generateId: vi.fn(() => 'generated-id'),
  };
});

// Mock audit trail
vi.mock('./middleware/audit-trail.js', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock request context
vi.mock('./middleware/request-context.js', () => ({
  registerRequestContext: vi.fn().mockResolvedValue(undefined),
}));

import type { FastifyInstance } from 'fastify';

describe('App Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const { buildApp } = await import('./app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Helper to generate a valid JWT
  function createTestToken(claims: Record<string, unknown> = {}) {
    return app.jwt.sign({
      sub: 'user-1',
      tenantId: 'tenant-1',
      email: 'test@example.com',
      role: 'admin',
      permissions: ['read:all', 'write:all'],
      ...claims,
    });
  }

  // ─── Health Check ────────────────────────────────────────

  describe('GET /api/v1/health', () => {
    it('returns ok status', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.status).toBe('ok');
      expect(body.version).toBe('0.1.0');
      expect(body.timestamp).toBeDefined();
    });

    it('does not require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      expect(response.statusCode).toBe(200);
    });
  });

  // ─── Readiness Check ─────────────────────────────────────

  describe('GET /api/v1/ready', () => {
    it('returns readiness structure with checks', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/ready',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database');
      expect(body.checks).toHaveProperty('redis');
    });
  });

  // ─── Auth Protection ─────────────────────────────────────

  describe('Unauthenticated requests to protected routes', () => {
    it('returns 401 for /api/v1/alerts without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for /api/v1/cases without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/cases',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 401 for /api/v1/signals without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/signals',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 401 for /api/v1/risk-scores without token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/risk-scores',
      });

      expect(response.statusCode).toBe(401);
    });

    it('returns 401 with invalid Bearer token', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: { authorization: 'Bearer invalid-jwt' },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  // ─── CORS ────────────────────────────────────────────────

  describe('CORS headers', () => {
    it('includes CORS headers in development', async () => {
      const response = await app.inject({
        method: 'OPTIONS',
        url: '/api/v1/health',
        headers: {
          origin: 'http://localhost:3000',
          'access-control-request-method': 'GET',
        },
      });

      // Development mode should allow all origins
      expect(
        response.headers['access-control-allow-origin'],
      ).toBeDefined();
    });
  });

  // ─── Rate Limiting ───────────────────────────────────────

  describe('Rate limiting', () => {
    it('includes rate limit headers', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      // Rate limit headers should be present
      expect(response.headers['x-ratelimit-limit']).toBeDefined();
      expect(response.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });

  // ─── Swagger Docs ────────────────────────────────────────

  describe('API Documentation', () => {
    it('serves Swagger docs at /docs', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/docs/json',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.openapi).toBeDefined();
      expect(body.info.title).toBe('RiskRadar API');
    });
  });

  // ─── Authenticated Routes ────────────────────────────────

  describe('Authenticated route access', () => {
    it('allows access to /api/v1/alerts with valid JWT', async () => {
      const token = createTestToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: { authorization: `Bearer ${token}` },
      });

      // Should not be 401 — may be 200 or other status but not unauthorized
      expect(response.statusCode).not.toBe(401);
    });

    it('allows access to /api/v1/signals/stats with valid JWT', async () => {
      const token = createTestToken();

      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/signals/stats',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).not.toBe(401);
    });
  });

  // ─── Auth Routes (public) ───────────────────────────────

  describe('Public auth routes', () => {
    it('register endpoint is accessible without auth', async () => {
      const { prisma } = await import('@riskradar/database');
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          tenantName: 'Test Corp',
          tenantSlug: 'test-corp',
          industry: 'banking',
          name: 'Admin User',
          email: 'admin@test.com',
          password: 'securepassword123',
        },
      });

      // Should not be 401 — registration is public
      expect(response.statusCode).not.toBe(401);
    });
  });
});
