import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '@riskradar/database';
import { RolePermissions, type SystemRole, defaultTenantSettings } from '@riskradar/shared';
import { UserService } from '../users/user.service.js';
import { createAuditLog } from '../../middleware/audit-trail.js';
import { createHash, randomBytes } from 'node:crypto';

const userService = new UserService();

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Register new tenant + admin user
  app.post('/auth/register', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantName, tenantSlug, industry, name, email, password } = request.body as {
      tenantName: string;
      tenantSlug: string;
      industry: string;
      name: string;
      email: string;
      password: string;
    };

    // Validate
    if (!tenantName || !tenantSlug || !name || !email || !password) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'All fields are required' },
      });
    }

    if (password.length < 8) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Password must be at least 8 characters' },
      });
    }

    // Check slug availability
    const existingTenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } });
    if (existingTenant) {
      return reply.status(409).send({
        success: false,
        error: { code: 'CONFLICT', message: 'Organization slug already taken' },
      });
    }

    // Create tenant + admin user in transaction
    const salt = randomBytes(16).toString('hex');
    const passwordHash = `${salt}:${createHash('sha256').update(password + salt).digest('hex')}`;

    const result = await prisma.$transaction(async (tx) => {
      // Create tenant with industry-appropriate regulatory frameworks
      const regulatoryFrameworks = getDefaultFrameworks(industry);
      const tenant = await tx.tenant.create({
        data: {
          name: tenantName,
          slug: tenantSlug,
          industry,
          settings: {
            ...defaultTenantSettings,
            regulatoryFrameworks,
            plan: 'community', // Start on free plan
          },
        },
      });

      // Create system roles
      const roles = ['admin', 'compliance_officer', 'ciso', 'analyst', 'manager', 'auditor', 'regulator'];
      for (const roleName of roles) {
        await tx.role.create({
          data: { tenantId: tenant.id, name: roleName, isSystem: true, permissions: [] },
        });
      }

      // Create admin user
      const permissions = [...(RolePermissions['admin' as SystemRole] ?? [])];
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          name,
          passwordHash,
          role: 'admin',
          permissions,
        },
      });

      return { tenant, user };
    });

    // Generate JWT
    const token = app.jwt.sign({
      sub: result.user.id,
      tenantId: result.tenant.id,
      email,
      role: 'admin',
      permissions: [...(RolePermissions['admin' as SystemRole] ?? [])],
    });

    await createAuditLog({
      tenantId: result.tenant.id,
      actorType: 'user',
      actorId: result.user.id,
      action: 'user.created' as any,
      resource: 'tenant',
      resourceId: result.tenant.id,
      details: { action: 'tenant_registered', tenantName, industry },
    });

    return reply.status(201).send({
      success: true,
      data: {
        accessToken: token,
        expiresIn: 900,
        user: { id: result.user.id, email, name, role: 'admin' },
        tenant: { id: result.tenant.id, name: tenantName, slug: tenantSlug },
      },
    });
  });

  // Refresh token
  app.post('/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    // For now, reissue based on current valid token
    try {
      const decoded = await request.jwtVerify() as any;
      const token = app.jwt.sign({
        sub: decoded.sub,
        tenantId: decoded.tenantId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
      });
      return reply.send({ success: true, data: { accessToken: token, expiresIn: 900 } });
    } catch {
      return reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }
  });
}

function getDefaultFrameworks(industry: string): string[] {
  const frameworkMap: Record<string, string[]> = {
    banking: ['BSA_AML', 'SOX', 'GLBA', 'FFIEC'],
    credit_union: ['BSA_AML', 'NCUA'],
    insurance: ['SOX', 'NAIC'],
    healthcare: ['HIPAA', 'HITECH', 'SOX'],
    manufacturing: ['SOX', 'OSHA'],
    technology: ['SOC2', 'GDPR', 'CCPA'],
    retail: ['PCI_DSS', 'CCPA'],
    government: ['FISMA', 'NIST_CSF', 'FedRAMP'],
  };
  return frameworkMap[industry] ?? ['SOC2'];
}
