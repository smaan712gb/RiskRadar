import { prisma } from '@riskradar/database';
import { type Result, ok, err } from '@riskradar/shared';
import { getQueue, QueueNames, type IntegrationSyncJob } from '@riskradar/queue';
import { type PaginationOptions, buildPaginationMeta, buildPrismaSkipTake } from '../../lib/pagination.js';
import { NotFoundError } from '../../lib/errors.js';
import { createAuditLog } from '../../middleware/audit-trail.js';
import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ENCRYPTION_KEY = process.env['ENCRYPTION_KEY'] ?? 'change-me-32-byte-hex-key-for-field-encryption';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

function decrypt(encryptedText: string): string {
  const [ivHex, tagHex, encrypted] = encryptedText.split(':');
  if (!ivHex || !tagHex || !encrypted) throw new Error('Invalid encrypted format');
  const key = createHash('sha256').update(ENCRYPTION_KEY).digest();
  const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, 'hex'));
  decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export class IntegrationService {
  async listIntegrations(tenantId: string, pagination: PaginationOptions) {
    const [integrations, total] = await Promise.all([
      prisma.integration.findMany({
        where: { tenantId },
        orderBy: { updatedAt: 'desc' },
        ...buildPrismaSkipTake(pagination),
        select: {
          id: true, name: true, integrationType: true, provider: true,
          status: true, lastSyncAt: true, lastSyncStatus: true,
          syncSchedule: true, createdAt: true, updatedAt: true,
        },
      }),
      prisma.integration.count({ where: { tenantId } }),
    ]);
    return { integrations, pagination: buildPaginationMeta(total, pagination) };
  }

  async getIntegrationById(tenantId: string, integrationId: string) {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
    });
    if (!integration) throw new NotFoundError('Integration', integrationId);

    // Don't expose raw credentials
    return {
      ...integration,
      credentials: '***ENCRYPTED***',
      config: integration.config,
    };
  }

  async createIntegration(
    tenantId: string,
    input: {
      name: string;
      integrationType: string;
      provider: string;
      config: Record<string, unknown>;
      credentials: Record<string, string>;
      syncSchedule?: string;
      healthCheckUrl?: string;
    },
    userId: string,
  ): Promise<Result<{ id: string }, Error>> {
    // Encrypt credentials at rest
    const encryptedCreds = Object.fromEntries(
      Object.entries(input.credentials).map(([k, v]) => [k, encrypt(v)]),
    );

    const integration = await prisma.integration.create({
      data: {
        tenantId,
        name: input.name,
        integrationType: input.integrationType,
        provider: input.provider,
        config: input.config,
        credentials: encryptedCreds,
        syncSchedule: input.syncSchedule ?? null,
        healthCheckUrl: input.healthCheckUrl ?? null,
        status: 'inactive',
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'integration.created',
      resource: 'integration',
      resourceId: integration.id,
      details: { name: input.name, provider: input.provider, type: input.integrationType },
    });

    return ok({ id: integration.id });
  }

  async testConnection(tenantId: string, integrationId: string): Promise<Result<{ success: boolean; latencyMs: number }, Error>> {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
    });
    if (!integration) return err(new NotFoundError('Integration', integrationId));

    const config = integration.config as { baseUrl: string; endpoints: Record<string, string> };
    const healthUrl = integration.healthCheckUrl ?? `${config.baseUrl}/health`;

    const start = Date.now();
    try {
      const response = await fetch(healthUrl, {
        signal: AbortSignal.timeout(10000),
      });
      const latencyMs = Date.now() - start;

      const success = response.ok;
      await prisma.integration.update({
        where: { id: integrationId },
        data: {
          status: success ? 'active' : 'error',
          lastSyncStatus: success ? 'connection_ok' : `http_${response.status}`,
        },
      });

      return ok({ success, latencyMs });
    } catch (error) {
      await prisma.integration.update({
        where: { id: integrationId },
        data: { status: 'error', lastSyncStatus: String(error) },
      });
      return ok({ success: false, latencyMs: Date.now() - start });
    }
  }

  async triggerSync(tenantId: string, integrationId: string, userId: string): Promise<Result<{ jobId: string }, Error>> {
    const integration = await prisma.integration.findFirst({
      where: { id: integrationId, tenantId },
    });
    if (!integration) return err(new NotFoundError('Integration', integrationId));

    const queue = getQueue(QueueNames.INTEGRATION_SYNC);
    const job = await queue.add('sync', {
      tenantId,
      integrationId,
      syncType: 'incremental',
    } satisfies IntegrationSyncJob);

    await prisma.integration.update({
      where: { id: integrationId },
      data: { status: 'syncing' },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'integration.synced',
      resource: 'integration',
      resourceId: integrationId,
      details: { syncType: 'incremental', jobId: job.id },
    });

    return ok({ jobId: job.id ?? 'queued' });
  }
}
