import type { FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import type { Permission } from '@riskradar/shared';

/**
 * Authentication guard — verifies JWT and injects user context.
 * Used as a preHandler hook on protected routes.
 */
export async function authGuard(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    const decoded = await request.jwtVerify();
    (request as any).user = decoded;
  } catch (error) {
    reply.status(401).send({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid or expired authentication token',
      },
    });
  }
}

/**
 * Permission guard factory.
 * Returns a preHandler that checks if the authenticated user has
 * the required permission.
 */
export function requirePermission(permission: Permission) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const user = (request as any).user;
    if (!user) {
      reply.status(401).send({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const permissions = user.permissions as string[] ?? [];
    if (!permissions.includes(permission)) {
      reply.status(403).send({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: `Missing required permission: ${permission}`,
        },
      });
    }
  };
}

/**
 * Tenant isolation guard.
 * Ensures all queries are scoped to the authenticated user's tenant.
 */
export function getTenantId(request: FastifyRequest): string {
  const user = (request as any).user;
  if (!user?.tenantId) {
    throw new Error('Tenant context not available');
  }
  return user.tenantId;
}

export function getUserId(request: FastifyRequest): string {
  const user = (request as any).user;
  if (!user?.sub) {
    throw new Error('User context not available');
  }
  return user.sub;
}
