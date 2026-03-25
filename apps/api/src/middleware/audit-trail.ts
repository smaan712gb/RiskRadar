import { prisma } from '@riskradar/database';
import type { ActorType } from '@riskradar/shared';

interface AuditEntry {
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details as any,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Audit log failures should not break the request, but must be logged
    const { logger } = await import('@riskradar/logger');
    logger.error(
      { error, action: entry.action, resource: entry.resource, resourceId: entry.resourceId },
      'Failed to create audit log entry',
    );
  }
}
