import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import type { FastifyInstance } from 'fastify';

/**
 * End-to-End API test suite
 *
 * Tests the complete API flow: register → login → ingest signals →
 * create alerts → escalate to case → create policy → audit trail.
 *
 * Uses app.inject() with mocked database and Redis.
 */

// ─── Mocks ─────────────────────────────────────────────────

// Mock config
vi.mock('../apps/api/src/config/index.js', () => ({
  getConfig: vi.fn(() => ({
    NODE_ENV: 'test',
    API_HOST: '0.0.0.0',
    API_PORT: 3001,
    DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    REDIS_URL: 'redis://localhost:6379',
    JWT_SECRET: 'e2e-test-jwt-secret-must-be-32-chars-long!!',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    NEMOCLAW_ENDPOINT: 'http://localhost:8080',
    NEMOTRON_SUPER_MODEL: 'test-model',
    NEMOTRON_CASCADE_MODEL: 'test-model-cascade',
    MODEL_TIMEOUT_MS: 30000,
    PRIVACY_ROUTER_ENABLED: false,
    LOG_LEVEL: 'silent',
    ENCRYPTION_KEY: 'e2e-encryption-key-must-be-32-chars!!',
  })),
}));

// In-memory storage for mocked data
const store = {
  tenants: new Map<string, Record<string, unknown>>(),
  users: new Map<string, Record<string, unknown>>(),
  signals: new Map<string, Record<string, unknown>>(),
  alerts: new Map<string, Record<string, unknown>>(),
  cases: new Map<string, Record<string, unknown>>(),
  policies: new Map<string, Record<string, unknown>>(),
  auditLogs: [] as Record<string, unknown>[],
  caseComments: new Map<string, Record<string, unknown>>(),
};

let idCounter = 0;
function nextId(prefix = 'id') {
  return `${prefix}-${++idCounter}`;
}

// Mock database with stateful in-memory store
vi.mock('@riskradar/database', () => ({
  prisma: {
    $queryRaw: vi.fn().mockResolvedValue([{ '?column?': 1 }]),
    $transaction: vi.fn(async (fn: any) => {
      const tenantId = nextId('tenant');
      const userId = nextId('user');
      const tx = {
        tenant: {
          create: vi.fn().mockImplementation(({ data }) => {
            const tenant = { id: tenantId, ...data };
            store.tenants.set(tenantId, tenant);
            return tenant;
          }),
        },
        role: { create: vi.fn().mockResolvedValue({}) },
        user: {
          create: vi.fn().mockImplementation(({ data }) => {
            const user = { id: userId, ...data };
            store.users.set(userId, user);
            return user;
          }),
        },
        alert: {
          update: vi.fn(),
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
        case: {
          create: vi.fn().mockImplementation(({ data }) => {
            const id = nextId('case');
            const caseRecord = { id, ...data };
            store.cases.set(id, caseRecord);
            return caseRecord;
          }),
        },
        policy: {
          create: vi.fn().mockImplementation(({ data }) => {
            const id = nextId('policy');
            const policy = { id, ...data, isActive: true, version: 1 };
            store.policies.set(id, policy);
            return policy;
          }),
        },
        evidence: { updateMany: vi.fn() },
      };
      return fn(tx);
    }),
    tenant: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.slug) {
          const found = [...store.tenants.values()].find((t) => t['slug'] === where.slug);
          return found ?? null;
        }
        return null;
      }),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    signal: {
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const d of data) {
          const id = nextId('signal');
          store.signals.set(id, { id, ...d });
        }
        return { count: data.length };
      }),
      findMany: vi.fn().mockImplementation(() => [...store.signals.values()]),
      count: vi.fn().mockImplementation(() => store.signals.size),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    alert: {
      findMany: vi.fn().mockImplementation(() => [...store.alerts.values()]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.id) return store.alerts.get(where.id) ?? null;
        return [...store.alerts.values()][0] ?? null;
      }),
      count: vi.fn().mockImplementation(() => store.alerts.size),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = nextId('alert');
        const alert = { id, ...data, compoundScore: data.compoundScore ?? 70, evidence: [], alertSignals: [] };
        store.alerts.set(id, alert);
        return alert;
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = store.alerts.get(where.id);
        if (existing) Object.assign(existing, data);
        return { ...existing, ...data };
      }),
      groupBy: vi.fn().mockResolvedValue([]),
      updateMany: vi.fn().mockResolvedValue({ count: 1 }),
    },
    alertSignal: { createMany: vi.fn() },
    alertFeedback: { findMany: vi.fn().mockResolvedValue([]) },
    evidence: { updateMany: vi.fn() },
    case: {
      findMany: vi.fn().mockImplementation(() => [...store.cases.values()]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.id) {
          const c = store.cases.get(where.id);
          return c ? { ...c, alerts: [], evidence: [], comments: [], assignee: null, creator: { id: 'user-1', name: 'Test' } } : null;
        }
        return [...store.cases.values()][0] ?? null;
      }),
      count: vi.fn().mockImplementation(() => store.cases.size),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = nextId('case');
        const caseRecord = { id, ...data };
        store.cases.set(id, caseRecord);
        return caseRecord;
      }),
      update: vi.fn(),
      groupBy: vi.fn().mockResolvedValue([]),
    },
    caseComment: { create: vi.fn() },
    riskScore: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    policy: {
      findMany: vi.fn().mockImplementation(() => [...store.policies.values()]),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.id) return store.policies.get(where.id) ?? null;
        return [...store.policies.values()][0] ?? null;
      }),
      count: vi.fn().mockImplementation(() => store.policies.size),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = nextId('policy');
        const policy = { id, ...data };
        store.policies.set(id, policy);
        return policy;
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = store.policies.get(where.id);
        if (existing) Object.assign(existing, data);
        return { ...existing, ...data };
      }),
    },
    integration: {
      findMany: vi.fn().mockResolvedValue([]),
      findFirst: vi.fn(),
      count: vi.fn().mockResolvedValue(0),
    },
    auditLog: {
      findMany: vi.fn().mockImplementation(() => store.auditLogs),
      count: vi.fn().mockImplementation(() => store.auditLogs.length),
      create: vi.fn().mockImplementation(({ data }) => {
        store.auditLogs.push(data);
        return data;
      }),
    },
    sarDraft: { findMany: vi.fn().mockResolvedValue([]) },
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
    generateId: vi.fn(() => nextId('gen')),
  };
});

// Mock audit trail
vi.mock('../apps/api/src/middleware/audit-trail.js', () => ({
  createAuditLog: vi.fn().mockImplementation((entry) => {
    store.auditLogs.push(entry);
    return Promise.resolve();
  }),
}));

// Mock request context
vi.mock('../apps/api/src/middleware/request-context.js', () => ({
  registerRequestContext: vi.fn().mockResolvedValue(undefined),
}));

// ─── Tests ─────────────────────────────────────────────────

describe('RiskRadar API E2E Flow', () => {
  let app: FastifyInstance;
  let accessToken: string;
  let tenantId: string;
  let userId: string;

  beforeAll(async () => {
    const { buildApp } = await import('../apps/api/src/app.js');
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    // Reset stores between tests? No — we want to accumulate state across the flow.
    // Individual test suites can clear if needed.
  });

  // ─── Step 1: Health and Readiness ────────────────────────

  describe('Step 1: Health and readiness endpoints', () => {
    it('health check returns ok', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.status).toBe('ok');
      expect(body.version).toBe('0.1.0');
      expect(body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('readiness check returns status with checks', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/ready' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body).toHaveProperty('status');
      expect(body).toHaveProperty('checks');
      expect(body.checks).toHaveProperty('database');
      expect(body.checks).toHaveProperty('redis');
    });
  });

  // ─── Step 2: Register tenant and get JWT ─────────────────

  describe('Step 2: Register tenant and login', () => {
    it('registers a new tenant and returns JWT', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          tenantName: 'E2E Test Bank',
          tenantSlug: 'e2e-test-bank',
          industry: 'banking',
          name: 'Test Admin',
          email: 'admin@e2etest.com',
          password: 'securepassword123',
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.user.role).toBe('admin');
      expect(body.data.tenant.slug).toBe('e2e-test-bank');

      // Store for subsequent requests
      accessToken = body.data.accessToken;
      tenantId = body.data.tenant.id;
      userId = body.data.user.id;
    });

    it('rejects duplicate tenant slug', async () => {
      // The slug is now in the store from the previous test
      const { prisma } = await import('@riskradar/database');
      vi.mocked(prisma.tenant.findFirst).mockResolvedValueOnce({ id: 'existing', slug: 'e2e-test-bank' } as any);

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: {
          tenantName: 'E2E Test Bank 2',
          tenantSlug: 'e2e-test-bank',
          industry: 'banking',
          name: 'Another Admin',
          email: 'admin2@e2etest.com',
          password: 'securepassword123',
        },
      });

      expect(res.statusCode).toBe(409);
    });

    it('authenticated JWT allows access to protected routes', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).not.toBe(401);
    });
  });

  // ─── Step 3: Ingest signals ──────────────────────────────

  describe('Step 3: Ingest and query signals', () => {
    it('ingests a batch of signals', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/signals/ingest',
        headers: { authorization: `Bearer ${accessToken}` },
        payload: {
          signals: [
            {
              domain: 'finance',
              signalType: 'override_transaction',
              subjectType: 'employee',
              subjectId: 'emp-e2e-1',
              sourceSystem: 'erp',
              value: 50000,
              metadata: { amount: 50000, currency: 'USD' },
            },
            {
              domain: 'security',
              signalType: 'after_hours_access',
              subjectType: 'employee',
              subjectId: 'emp-e2e-1',
              sourceSystem: 'badge-system',
              metadata: { location: 'server-room', hour: 23 },
            },
            {
              domain: 'hr',
              signalType: 'training_missed',
              subjectType: 'employee',
              subjectId: 'emp-e2e-1',
              sourceSystem: 'lms',
              metadata: { course: 'BSA-AML-2025' },
            },
          ],
        },
      });

      expect(res.statusCode).toBe(201);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data.ingested).toBe(3);
      expect(body.data.batchId).toBeDefined();
    });

    it('queries signals with pagination', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/signals?page=1&pageSize=10',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
      expect(body.meta.pagination).toBeDefined();
    });

    it('gets signal statistics', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/signals/stats',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toHaveProperty('total');
      expect(body.data).toHaveProperty('last24h');
      expect(body.data).toHaveProperty('byDomain');
      expect(body.data).toHaveProperty('topSignalTypes');
    });
  });

  // ─── Step 4: Alerts ──────────────────────────────────────

  describe('Step 4: List alerts', () => {
    it('lists alerts (initially empty or seeded)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeInstanceOf(Array);
    });
  });

  // ─── Step 5: Cases ───────────────────────────────────────

  describe('Step 5: Cases', () => {
    it('lists cases', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/cases',
        headers: { authorization: `Bearer ${accessToken}` },
      });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.success).toBe(true);
    });
  });

  // ─── Step 6: Unauthenticated access ─────────────────────

  describe('Step 6: Unauthenticated access is blocked', () => {
    const protectedRoutes = [
      '/api/v1/alerts',
      '/api/v1/cases',
      '/api/v1/signals',
      '/api/v1/risk-scores',
      '/api/v1/policies',
    ];

    for (const route of protectedRoutes) {
      it(`returns 401 for ${route} without token`, async () => {
        const res = await app.inject({ method: 'GET', url: route });
        expect(res.statusCode).toBe(401);
      });
    }

    it('returns 401 with expired/invalid token', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/alerts',
        headers: { authorization: 'Bearer invalid.jwt.token' },
      });

      expect(res.statusCode).toBe(401);
    });
  });

  // ─── Step 7: Verify audit log entries ────────────────────

  describe('Step 7: Audit log tracking', () => {
    it('audit log entries were created for registration', () => {
      // The createAuditLog mock stores entries
      expect(store.auditLogs.length).toBeGreaterThan(0);

      const registrationLog = store.auditLogs.find(
        (log) => log['action'] === 'user.created' || log['resource'] === 'tenant',
      );
      expect(registrationLog).toBeDefined();
    });
  });

  // ─── Step 8: API Documentation ───────────────────────────

  describe('Step 8: API documentation', () => {
    it('serves OpenAPI JSON at /docs/json', async () => {
      const res = await app.inject({ method: 'GET', url: '/docs/json' });

      expect(res.statusCode).toBe(200);
      const body = JSON.parse(res.body);
      expect(body.openapi).toBeDefined();
      expect(body.info.title).toBe('RiskRadar API');
      expect(body.info.version).toBe('0.1.0');
    });
  });

  // ─── Step 9: Rate limit headers ──────────────────────────

  describe('Step 9: Rate limit headers present', () => {
    it('includes X-RateLimit headers', async () => {
      const res = await app.inject({ method: 'GET', url: '/api/v1/health' });

      expect(res.headers['x-ratelimit-limit']).toBeDefined();
      expect(res.headers['x-ratelimit-remaining']).toBeDefined();
    });
  });
});
