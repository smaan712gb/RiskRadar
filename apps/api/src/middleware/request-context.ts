import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import type { FastifyInstance } from 'fastify';

export interface RequestContext {
  requestId: string;
  tenantId?: string;
  userId?: string;
  startTime: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

export async function registerRequestContext(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', async (request) => {
    const context: RequestContext = {
      requestId: (request.headers['x-request-id'] as string) ?? randomUUID(),
      startTime: Date.now(),
    };

    requestContextStorage.enterWith(context);
    request.headers['x-request-id'] = context.requestId;
  });

  app.addHook('onResponse', async (request, reply) => {
    reply.header('x-request-id', request.headers['x-request-id']);
  });
}
