import { prisma, type PrismaTransactionClient } from '@riskradar/database';
import { type Result, ok, err } from '@riskradar/shared';
import { isValidTransition, type AlertStatusType } from '@riskradar/shared';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError, InvalidStateTransitionError } from '../../lib/errors.js';
import { createAuditLog } from '../../middleware/audit-trail.js';

export interface AlertFilters {
  status?: string;
  severity?: string;
  alertType?: string;
  domain?: string;
  subjectId?: string;
  assignedTo?: string;
}

export class AlertService {
  async listAlerts(
    tenantId: string,
    filters: AlertFilters,
    pagination: PaginationOptions,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.severity && { severity: filters.severity }),
      ...(filters.alertType && { alertType: filters.alertType }),
      ...(filters.domain && { domains: { has: filters.domain } }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
    };

    const [alerts, total] = await Promise.all([
      prisma.alert.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...buildPrismaSkipTake(pagination),
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true } },
          _count: { select: { evidence: true, alertSignals: true } },
        },
      }),
      prisma.alert.count({ where }),
    ]);

    return {
      alerts,
      pagination: buildPaginationMeta(total, pagination),
    };
  }

  async getAlertById(tenantId: string, alertId: string) {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, tenantId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true } },
        evidence: { orderBy: { timestamp: 'asc' } },
        alertSignals: true,
        case: { select: { id: true, title: true, status: true } },
      },
    });

    if (!alert) {
      throw new NotFoundError('Alert', alertId);
    }

    return alert;
  }

  async updateAlertStatus(
    tenantId: string,
    alertId: string,
    input: {
      status: AlertStatusType;
      reviewNotes?: string;
      dismissReason?: string;
    },
    userId: string,
  ): Promise<Result<unknown, Error>> {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, tenantId },
    });

    if (!alert) {
      return err(new NotFoundError('Alert', alertId));
    }

    const currentStatus = alert.status as AlertStatusType;
    if (!isValidTransition(currentStatus, input.status)) {
      return err(
        new InvalidStateTransitionError('Alert', currentStatus, input.status),
      );
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: {
        status: input.status,
        reviewedBy: userId,
        reviewedAt: new Date(),
        reviewNotes: input.reviewNotes ?? null,
        dismissReason: input.status === 'dismissed' ? input.dismissReason : null,
      },
    });

    // Audit log
    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'alert.status_changed',
      resource: 'alert',
      resourceId: alertId,
      details: {
        before: { status: currentStatus },
        after: { status: input.status },
        reviewNotes: input.reviewNotes,
        dismissReason: input.dismissReason,
      },
    });

    return ok(updated);
  }

  async assignAlert(
    tenantId: string,
    alertId: string,
    assigneeId: string,
    assignedBy: string,
  ): Promise<Result<unknown, Error>> {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, tenantId },
    });

    if (!alert) {
      return err(new NotFoundError('Alert', alertId));
    }

    const updated = await prisma.alert.update({
      where: { id: alertId },
      data: { assignedTo: assigneeId },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: assignedBy,
      action: 'alert.assigned',
      resource: 'alert',
      resourceId: alertId,
      details: {
        before: { assignedTo: alert.assignedTo },
        after: { assignedTo: assigneeId },
      },
    });

    return ok(updated);
  }

  async escalateToCase(
    tenantId: string,
    alertId: string,
    userId: string,
  ): Promise<Result<{ caseId: string }, Error>> {
    const alert = await prisma.alert.findFirst({
      where: { id: alertId, tenantId },
    });

    if (!alert) {
      return err(new NotFoundError('Alert', alertId));
    }

    const result = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      // Create case
      const newCase = await tx.case.create({
        data: {
          tenantId,
          title: `Case: ${alert.title}`,
          description: alert.description,
          status: 'open',
          priority: alert.severity === 'critical' ? 'critical' : alert.severity === 'high' ? 'high' : 'medium',
          subjectType: alert.subjectType,
          subjectId: alert.subjectId,
          createdBy: userId,
          slaDeadline: new Date(Date.now() + (alert.severity === 'critical' ? 2 : 8) * 60 * 60 * 1000),
        },
      });

      // Link alert to case
      await tx.alert.update({
        where: { id: alertId },
        data: {
          status: 'escalated',
          caseId: newCase.id,
          reviewedBy: userId,
          reviewedAt: new Date(),
        },
      });

      // Copy evidence to case
      await tx.evidence.updateMany({
        where: { alertId },
        data: { caseId: newCase.id },
      });

      return newCase;
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'alert.escalated',
      resource: 'alert',
      resourceId: alertId,
      details: { caseId: result.id },
    });

    return ok({ caseId: result.id });
  }

  async getAlertStats(tenantId: string) {
    const [byStatus, bySeverity, byDomain, total, recentCount] = await Promise.all([
      prisma.alert.groupBy({
        by: ['status'],
        where: { tenantId },
        _count: true,
      }),
      prisma.alert.groupBy({
        by: ['severity'],
        where: { tenantId },
        _count: true,
      }),
      prisma.alert.groupBy({
        by: ['alertType'],
        where: { tenantId },
        _count: true,
      }),
      prisma.alert.count({ where: { tenantId } }),
      prisma.alert.count({
        where: {
          tenantId,
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      }),
    ]);

    return {
      total,
      last24h: recentCount,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      bySeverity: Object.fromEntries(bySeverity.map((s) => [s.severity, s._count])),
      byType: Object.fromEntries(byDomain.map((s) => [s.alertType, s._count])),
    };
  }
}
