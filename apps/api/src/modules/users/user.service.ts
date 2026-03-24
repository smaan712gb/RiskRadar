import { prisma } from '@riskradar/database';
import { type Result, ok, err } from '@riskradar/shared';
import { RolePermissions, type SystemRole } from '@riskradar/shared';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError, ConflictError, UnauthorizedError } from '../../lib/errors.js';
import { createAuditLog } from '../../middleware/audit-trail.js';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const candidate = createHash('sha256').update(password + salt).digest('hex');
  return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(candidate, 'hex'));
}

export class UserService {
  async listUsers(tenantId: string, pagination: PaginationOptions) {
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        ...buildPrismaSkipTake(pagination),
        select: {
          id: true, email: true, name: true, role: true,
          isActive: true, mfaEnabled: true, lastLoginAt: true,
          createdAt: true, updatedAt: true,
        },
      }),
      prisma.user.count({ where: { tenantId } }),
    ]);
    return { users, pagination: buildPaginationMeta(total, pagination) };
  }

  async getUserById(tenantId: string, userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true, email: true, name: true, role: true, permissions: true,
        isActive: true, mfaEnabled: true, lastLoginAt: true,
        createdAt: true, updatedAt: true,
      },
    });
    if (!user) throw new NotFoundError('User', userId);
    return user;
  }

  async createUser(
    tenantId: string,
    input: { email: string; name: string; password: string; role: SystemRole },
    createdBy: string,
  ): Promise<Result<{ id: string }, Error>> {
    const existing = await prisma.user.findFirst({
      where: { tenantId, email: input.email },
    });
    if (existing) return err(new ConflictError(`User with email '${input.email}' already exists`));

    const permissions = RolePermissions[input.role] ?? [];
    const user = await prisma.user.create({
      data: {
        tenantId,
        email: input.email,
        name: input.name,
        passwordHash: hashPassword(input.password),
        role: input.role,
        permissions: [...permissions],
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: createdBy,
      action: 'user.created',
      resource: 'user',
      resourceId: user.id,
      details: { email: input.email, role: input.role },
    });

    return ok({ id: user.id });
  }

  async authenticate(
    tenantId: string,
    email: string,
    password: string,
  ): Promise<Result<{ userId: string; role: SystemRole; permissions: string[] }, Error>> {
    const user = await prisma.user.findFirst({
      where: { tenantId, email, isActive: true },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      return err(new UnauthorizedError('Invalid email or password'));
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const permissions = user.permissions.length > 0
      ? user.permissions
      : [...(RolePermissions[user.role as SystemRole] ?? [])];

    return ok({
      userId: user.id,
      role: user.role as SystemRole,
      permissions,
    });
  }

  async deactivateUser(
    tenantId: string,
    userId: string,
    deactivatedBy: string,
  ): Promise<Result<unknown, Error>> {
    const user = await prisma.user.findFirst({ where: { id: userId, tenantId } });
    if (!user) return err(new NotFoundError('User', userId));

    await prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    // Revoke all refresh tokens
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revokedAt: new Date() },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: deactivatedBy,
      action: 'user.deactivated',
      resource: 'user',
      resourceId: userId,
      details: { email: user.email },
    });

    return ok({ deactivated: true });
  }
}
