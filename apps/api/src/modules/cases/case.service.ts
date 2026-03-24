import { prisma, type PrismaTransactionClient } from '@riskradar/database';
import { type Result, ok, err } from '@riskradar/shared';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../middleware/audit-trail.js';
import { CaseSLAHours, type CasePriorityType } from '@riskradar/shared';

export interface CaseFilters {
  status?: string;
  priority?: string;
  assignedTo?: string;
  subjectId?: string;
  tag?: string;
}

export class CaseService {
  async listCases(
    tenantId: string,
    filters: CaseFilters,
    pagination: PaginationOptions,
    sortBy = 'createdAt',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const where = {
      tenantId,
      ...(filters.status && { status: filters.status }),
      ...(filters.priority && { priority: filters.priority }),
      ...(filters.assignedTo && { assignedTo: filters.assignedTo }),
      ...(filters.subjectId && { subjectId: filters.subjectId }),
      ...(filters.tag && { tags: { has: filters.tag } }),
    };

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        ...buildPrismaSkipTake(pagination),
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { alerts: true, evidence: true, comments: true } },
        },
      }),
      prisma.case.count({ where }),
    ]);

    return { cases, pagination: buildPaginationMeta(total, pagination) };
  }

  async getCaseById(tenantId: string, caseId: string) {
    const caseRecord = await prisma.case.findFirst({
      where: { id: caseId, tenantId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true } },
        alerts: {
          select: { id: true, title: true, severity: true, status: true, compoundScore: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
        },
        evidence: { orderBy: { timestamp: 'asc' } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!caseRecord) throw new NotFoundError('Case', caseId);
    return caseRecord;
  }

  async createCase(
    tenantId: string,
    input: {
      title: string;
      description: string;
      priority: CasePriorityType;
      subjectType: string;
      subjectId: string;
      alertIds: string[];
      tags?: string[];
    },
    userId: string,
  ): Promise<Result<{ id: string }, Error>> {
    const slaHours = CaseSLAHours[input.priority] ?? 24;

    const newCase = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const created = await tx.case.create({
        data: {
          tenantId,
          title: input.title,
          description: input.description,
          status: 'open',
          priority: input.priority,
          subjectType: input.subjectType,
          subjectId: input.subjectId,
          createdBy: userId,
          slaDeadline: new Date(Date.now() + slaHours * 60 * 60 * 1000),
          tags: input.tags ?? [],
        },
      });

      // Link alerts to case
      if (input.alertIds.length > 0) {
        await tx.alert.updateMany({
          where: { id: { in: input.alertIds }, tenantId },
          data: { caseId: created.id, status: 'escalated' },
        });
      }

      return created;
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'case.created',
      resource: 'case',
      resourceId: newCase.id,
      details: { title: input.title, priority: input.priority, alertIds: input.alertIds },
    });

    return ok({ id: newCase.id });
  }

  async updateCase(
    tenantId: string,
    caseId: string,
    input: {
      title?: string;
      description?: string;
      status?: string;
      priority?: string;
      assignedTo?: string | null;
      resolution?: string;
      tags?: string[];
    },
    userId: string,
  ): Promise<Result<unknown, Error>> {
    const existing = await prisma.case.findFirst({ where: { id: caseId, tenantId } });
    if (!existing) return err(new NotFoundError('Case', caseId));

    const isClosing = input.status?.startsWith('closed_');
    const updated = await prisma.case.update({
      where: { id: caseId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.description && { description: input.description }),
        ...(input.status && { status: input.status }),
        ...(input.priority && { priority: input.priority }),
        ...(input.assignedTo !== undefined && { assignedTo: input.assignedTo }),
        ...(input.resolution && { resolution: input.resolution }),
        ...(input.tags && { tags: input.tags }),
        ...(isClosing && { resolvedAt: new Date() }),
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: input.status ? 'case.status_changed' : 'case.updated' as any,
      resource: 'case',
      resourceId: caseId,
      details: { before: { status: existing.status }, after: input },
    });

    return ok(updated);
  }

  async addComment(
    tenantId: string,
    caseId: string,
    input: { content: string; isInternal: boolean },
    userId: string,
  ): Promise<Result<{ id: string }, Error>> {
    const existing = await prisma.case.findFirst({ where: { id: caseId, tenantId } });
    if (!existing) return err(new NotFoundError('Case', caseId));

    const comment = await prisma.caseComment.create({
      data: {
        caseId,
        authorId: userId,
        content: input.content,
        isInternal: input.isInternal,
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'case.comment_added',
      resource: 'case',
      resourceId: caseId,
      details: { commentId: comment.id, isInternal: input.isInternal },
    });

    return ok({ id: comment.id });
  }

  async getCaseStats(tenantId: string) {
    const [byStatus, byPriority, total, overdueCases] = await Promise.all([
      prisma.case.groupBy({ by: ['status'], where: { tenantId }, _count: true }),
      prisma.case.groupBy({ by: ['priority'], where: { tenantId }, _count: true }),
      prisma.case.count({ where: { tenantId } }),
      prisma.case.count({
        where: {
          tenantId,
          slaDeadline: { lt: new Date() },
          status: { notIn: ['closed_confirmed', 'closed_false_positive', 'closed_no_action'] },
        },
      }),
    ]);

    return {
      total,
      overdue: overdueCases,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
      byPriority: Object.fromEntries(byPriority.map((s) => [s.priority, s._count])),
    };
  }
}
