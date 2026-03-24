import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { BillingService } from './billing.service.js';

const billingService = new BillingService();

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  // Create checkout session
  app.post('/billing/checkout', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string; id: string };
    const { planId } = request.body as { planId: string };

    const baseUrl = process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000';
    const result = await billingService.createCheckoutSession(
      user.tenantId,
      planId as any,
      user.id,
      `${baseUrl}/settings/billing?success=true`,
      `${baseUrl}/pricing?cancelled=true`,
    );

    return reply.send({ success: true, data: result });
  });

  // Stripe webhook (no auth — Stripe signs it)
  app.post('/billing/webhook', {
    config: { rawBody: true },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const signature = request.headers['stripe-signature'] as string;
    if (!signature) {
      return reply.status(400).send({ error: 'Missing stripe-signature header' });
    }

    try {
      await billingService.handleWebhook(
        (request as any).rawBody ?? JSON.stringify(request.body),
        signature,
      );
      return reply.send({ received: true });
    } catch (error) {
      return reply.status(400).send({ error: 'Webhook verification failed' });
    }
  });

  // Get current plan
  app.get('/billing/plan', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const plan = await billingService.getCurrentPlan(user.tenantId);
    return reply.send({ success: true, data: plan });
  });

  // Customer portal
  app.post('/billing/portal', async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user as { tenantId: string };
    const result = await billingService.createCustomerPortalSession(user.tenantId);
    return reply.send({ success: true, data: result });
  });
}
