import { PrismaClient } from '@prisma/client';

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log:
      process.env['NODE_ENV'] === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  return client;
}

// Singleton pattern — prevents multiple instances during hot reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env['NODE_ENV'] !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Creates a tenant-scoped query helper.
 * All queries through this helper automatically include tenantId.
 */
export function tenantScope(tenantId: string) {
  return {
    where: { tenantId },
    whereUnique: (unique: Record<string, unknown>) => ({
      ...unique,
      tenantId,
    }),
  };
}

export type PrismaTransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];
