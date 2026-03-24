import { prisma } from '@riskradar/database';
import type { AuditAction, ActorType } from '@riskradar/shared';
import { getRequestContext } from './request-context.js';

interface AuditEntry {
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  action: AuditAction;
  resource: string;
  resourceId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditEntry): Promise<void> {
  const context = getRequestContext();

  try {
    await prisma.auditLog.create({
      data: {
        tenantId: entry.tenantId,
        actorType: entry.actorType,
        actorId: entry.actorId,
        action: entry.action,
        resource: entry.resource,
        resourceId: entry.resourceId,
        details: entry.details,
        ipAddress: entry.ipAddress ?? null,
        userAgent: entry.userAgent ?? null,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    // Audit log failures should not break the request, but must be logged
    console.error(
      `[AUDIT] Failed to create audit log: ${entry.action} on ${entry.resource}/${entry.resourceId}`,
      error,
    );
  }
}
