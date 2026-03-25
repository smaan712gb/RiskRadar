import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock Prisma
vi.mock('@riskradar/database', () => ({
  prisma: {
    tenant: { findFirst: vi.fn() },
    role: { create: vi.fn() },
    user: { create: vi.fn(), findFirst: vi.fn() },
    auditLog: { create: vi.fn() },
    $transaction: vi.fn(),
  },
}));

// Mock audit trail
vi.mock('../../middleware/audit-trail.js', () => ({
  createAuditLog: vi.fn().mockResolvedValue(undefined),
}));

// Mock shared
vi.mock('@riskradar/shared', async () => {
  const actual = await vi.importActual('@riskradar/shared') as Record<string, unknown>;
  return {
    ...actual,
    RolePermissions: {
      admin: ['read:all', 'write:all', 'admin:all'],
    },
    defaultTenantSettings: {
      riskThresholds: { low: 25, medium: 50, high: 75 },
    },
  };
});

const { prisma } = await import('@riskradar/database');

/**
 * Auth module is implemented as route handlers (not a separate service class).
 * We test it through Fastify's app.inject() to exercise the full route.
 */
import Fastify from 'fastify';
import jwt from '@fastify/jwt';

async function buildTestAuthApp() {
  const app = Fastify({ logger: false });

  await app.register(jwt, { secret: 'test-secret-must-be-32-chars-long!!' });

  const { authRoutes } = await import('./auth.routes.js');
  await app.register(authRoutes, { prefix: '/api/v1' });

  return app;
}

describe('Auth Routes', () => {
  let app: Awaited<ReturnType<typeof buildTestAuthApp>>;

  beforeEach(async () => {
    app = await buildTestAuthApp();
    vi.clearAllMocks();
  });

  // ─── Register ────────────────────────────────────────────

  describe('POST /auth/register', () => {
    const registerPayload = {
      tenantName: 'Acme Bank',
      tenantSlug: 'acme-bank',
      industry: 'banking',
      name: 'John Admin',
      email: 'john@acme.com',
      password: 'securepassword123',
    };

    it('creates tenant + admin user and returns tokens', async () => {
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null); // slug available

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          tenant: {
            create: vi.fn().mockResolvedValue({
              id: 'tenant-new',
              name: 'Acme Bank',
              slug: 'acme-bank',
            }),
          },
          role: { create: vi.fn().mockResolvedValue({}) },
          user: {
            create: vi.fn().mockResolvedValue({
              id: 'user-new',
              email: 'john@acme.com',
              name: 'John Admin',
              role: 'admin',
            }),
          },
        };
        return fn(tx);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerPayload,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(body.data.accessToken).toBeTypeOf('string');
      expect(body.data.user.email).toBe('john@acme.com');
      expect(body.data.user.role).toBe('admin');
      expect(body.data.tenant.slug).toBe('acme-bank');
    });

    it('returns 400 when required fields are missing', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { tenantName: 'Acme Bank' }, // Missing required fields
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('returns 400 for short passwords', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: { ...registerPayload, password: 'short' },
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.error.message).toContain('8 characters');
    });

    it('returns 409 when tenant slug already exists', async () => {
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue({
        id: 'existing-tenant',
        slug: 'acme-bank',
      } as any);

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerPayload,
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.error.code).toBe('CONFLICT');
    });

    it('returns a JWT that can be verified', async () => {
      vi.mocked(prisma.tenant.findFirst).mockResolvedValue(null);

      vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
        const tx = {
          tenant: { create: vi.fn().mockResolvedValue({ id: 'tenant-1', name: 'Acme', slug: 'acme-bank' }) },
          role: { create: vi.fn().mockResolvedValue({}) },
          user: { create: vi.fn().mockResolvedValue({ id: 'user-1', email: 'john@acme.com', name: 'John', role: 'admin' }) },
        };
        return fn(tx);
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/register',
        payload: registerPayload,
      });

      const body = JSON.parse(response.body);
      const token = body.data.accessToken;

      // Verify the JWT is valid and contains expected claims
      const decoded = app.jwt.verify(token) as Record<string, unknown>;
      expect(decoded['sub']).toBe('user-1');
      expect(decoded['tenantId']).toBe('tenant-1');
      expect(decoded['role']).toBe('admin');
      expect(decoded['permissions']).toContain('read:all');
    });
  });

  // ─── Refresh ─────────────────────────────────────────────

  describe('POST /auth/refresh', () => {
    it('issues new access token from valid token', async () => {
      const originalToken = app.jwt.sign({
        sub: 'user-1',
        tenantId: 'tenant-1',
        email: 'john@acme.com',
        role: 'admin',
        permissions: ['read:all'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { authorization: `Bearer ${originalToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.accessToken).toBeDefined();
      expect(typeof body.data.accessToken).toBe('string');
      expect(body.data.expiresIn).toBe(900);
    });

    it('returns 401 for invalid token', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { authorization: 'Bearer invalid-token' },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 when no token is provided', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
      });

      expect(response.statusCode).toBe(401);
    });

    it('preserves claims in refreshed token', async () => {
      const originalToken = app.jwt.sign({
        sub: 'user-42',
        tenantId: 'tenant-7',
        email: 'test@example.com',
        role: 'analyst',
        permissions: ['read:alerts', 'read:cases'],
      });

      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { authorization: `Bearer ${originalToken}` },
      });

      const body = JSON.parse(response.body);
      const decoded = app.jwt.verify(body.data.accessToken) as Record<string, unknown>;

      expect(decoded['sub']).toBe('user-42');
      expect(decoded['tenantId']).toBe('tenant-7');
      expect(decoded['role']).toBe('analyst');
      expect(decoded['permissions']).toEqual(['read:alerts', 'read:cases']);
    });
  });
});
