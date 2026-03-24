import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { UserService } from './user.service.js';
import { paginationSchema } from '@riskradar/shared';
import { isErr, unwrap } from '@riskradar/shared';

const userService = new UserService();

export async function userRoutes(app: FastifyInstance): Promise<void> {
  app.get('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const query = request.query as Record<string, string>;
    const pagination = paginationSchema.parse(query);
    const result = await userService.listUsers(user.tenantId, pagination);
    return reply.send({ success: true, data: result.users, meta: { pagination: result.pagination } });
  });

  app.get('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const { id } = request.params as { id: string };
    const userData = await userService.getUserById(user.tenantId, id);
    return reply.send({ success: true, data: userData });
  });

  app.post('/users', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const body = request.body as { email: string; name: string; password: string; role: string };
    const result = await userService.createUser(user.tenantId, body as any, user.id);
    if (isErr(result)) throw result.error;
    return reply.status(201).send({ success: true, data: unwrap(result) });
  });

  app.delete('/users/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { id } = request.params as { id: string };
    const result = await userService.deactivateUser(user.tenantId, id, user.id);
    if (isErr(result)) throw result.error;
    return reply.send({ success: true, data: unwrap(result) });
  });

  // Auth routes
  app.post('/auth/login', async (request: FastifyRequest, reply: FastifyReply) => {
    const { tenantSlug, email, password } = request.body as { tenantSlug: string; email: string; password: string };

    // Resolve tenant
    const tenant = await (await import('@riskradar/database')).prisma.tenant.findFirst({
      where: { slug: tenantSlug, isActive: true },
    });
    if (!tenant) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    const result = await userService.authenticate(tenant.id, email, password);
    if (isErr(result)) throw result.error;

    const authData = unwrap(result);
    const token = app.jwt.sign({
      sub: authData.userId,
      tenantId: tenant.id,
      email,
      role: authData.role,
      permissions: authData.permissions,
    });

    return reply.send({
      success: true,
      data: {
        accessToken: token,
        expiresIn: 900, // 15 minutes
        user: { id: authData.userId, email, role: authData.role },
      },
    });
  });
}
