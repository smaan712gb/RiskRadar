import { prisma } from '@riskradar/database';
import { type Result, ok, err } from '@riskradar/shared';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../middleware/audit-trail.js';

export class PolicyService {
  async listPolicies(
    tenantId: string,
    filters: { domain?: string; policyType?: string; isActive?: boolean },
    pagination: PaginationOptions,
  ) {
    const where = {
      tenantId,
      ...(filters.domain && { domain: filters.domain }),
      ...(filters.policyType && { policyType: filters.policyType }),
      ...(filters.isActive !== undefined && { isActive: filters.isActive }),
    };

    const [policies, total] = await Promise.all([
      prisma.policy.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        ...buildPrismaSkipTake(pagination),
      }),
      prisma.policy.count({ where }),
    ]);

    return { policies, pagination: buildPaginationMeta(total, pagination) };
  }

  async getPolicyById(tenantId: string, policyId: string) {
    const policy = await prisma.policy.findFirst({
      where: { id: policyId, tenantId },
    });
    if (!policy) throw new NotFoundError('Policy', policyId);
    return policy;
  }

  async createPolicy(
    tenantId: string,
    input: {
      name: string;
      description: string;
      policyType: string;
      domain: string;
      rules: Record<string, unknown>;
      naturalLanguage?: string;
      regulatoryRef?: string;
    },
    userId: string,
  ): Promise<Result<{ id: string }, Error>> {
    const policy = await prisma.policy.create({
      data: {
        tenantId,
        name: input.name,
        description: input.description,
        policyType: input.policyType,
        domain: input.domain,
        rules: input.rules,
        naturalLanguage: input.naturalLanguage ?? null,
        regulatoryRef: input.regulatoryRef ?? null,
        createdBy: userId,
        version: 1,
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'policy.created',
      resource: 'policy',
      resourceId: policy.id,
      details: { name: input.name, domain: input.domain, policyType: input.policyType },
    });

    return ok({ id: policy.id });
  }

  async updatePolicy(
    tenantId: string,
    policyId: string,
    input: {
      name?: string;
      description?: string;
      rules?: Record<string, unknown>;
      naturalLanguage?: string;
      regulatoryRef?: string;
    },
    userId: string,
  ): Promise<Result<{ id: string; version: number }, Error>> {
    const existing = await prisma.policy.findFirst({ where: { id: policyId, tenantId } });
    if (!existing) return err(new NotFoundError('Policy', policyId));

    // Create new version (policies are version-controlled)
    const updated = await prisma.policy.create({
      data: {
        tenantId,
        name: input.name ?? existing.name,
        description: input.description ?? existing.description,
        policyType: existing.policyType,
        domain: existing.domain,
        rules: (input.rules ?? existing.rules) as Record<string, unknown>,
        naturalLanguage: input.naturalLanguage ?? existing.naturalLanguage,
        regulatoryRef: input.regulatoryRef ?? existing.regulatoryRef,
        createdBy: userId,
        version: existing.version + 1,
        previousVersionId: existing.id,
        isActive: true,
      },
    });

    // Deactivate old version
    await prisma.policy.update({
      where: { id: policyId },
      data: { isActive: false },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'policy.updated',
      resource: 'policy',
      resourceId: updated.id,
      details: {
        previousVersionId: policyId,
        previousVersion: existing.version,
        newVersion: updated.version,
      },
    });

    return ok({ id: updated.id, version: updated.version });
  }

  async approvePolicy(
    tenantId: string,
    policyId: string,
    userId: string,
  ): Promise<Result<unknown, Error>> {
    const policy = await prisma.policy.findFirst({ where: { id: policyId, tenantId } });
    if (!policy) return err(new NotFoundError('Policy', policyId));

    const updated = await prisma.policy.update({
      where: { id: policyId },
      data: { approvedBy: userId, approvedAt: new Date() },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'policy.approved',
      resource: 'policy',
      resourceId: policyId,
      details: { name: policy.name, version: policy.version },
    });

    return ok(updated);
  }

  async deactivatePolicy(
    tenantId: string,
    policyId: string,
    userId: string,
  ): Promise<Result<unknown, Error>> {
    const policy = await prisma.policy.findFirst({ where: { id: policyId, tenantId } });
    if (!policy) return err(new NotFoundError('Policy', policyId));

    await prisma.policy.update({
      where: { id: policyId },
      data: { isActive: false },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'policy.deactivated',
      resource: 'policy',
      resourceId: policyId,
      details: { name: policy.name },
    });

    return ok({ deactivated: true });
  }
}
