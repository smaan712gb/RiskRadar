import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import { createAuditLog } from '../../middleware/audit-trail.js';

const logger = createLogger('billing');

// Stripe product IDs (configured in Stripe Dashboard)
const STRIPE_PLANS = {
  professional_monthly: process.env['STRIPE_PRICE_PRO_MONTHLY'] ?? '',
  professional_annual: process.env['STRIPE_PRICE_PRO_ANNUAL'] ?? '',
  enterprise_monthly: process.env['STRIPE_PRICE_ENT_MONTHLY'] ?? '',
  enterprise_annual: process.env['STRIPE_PRICE_ENT_ANNUAL'] ?? '',
} as const;

export class BillingService {
  private stripe: any; // Stripe SDK

  constructor() {
    const stripeKey = process.env['STRIPE_SECRET_KEY'];
    if (stripeKey) {
      // Dynamic import to avoid requiring stripe for self-hosted users
      import('stripe').then((Stripe) => {
        this.stripe = new Stripe.default(stripeKey, { apiVersion: '2024-12-18.acacia' as any });
      }).catch(() => {
        logger.warn('Stripe SDK not installed. Billing features disabled.');
      });
    } else {
      logger.info('No STRIPE_SECRET_KEY configured. Running in self-hosted mode (billing disabled).');
    }
  }

  async createCheckoutSession(
    tenantId: string,
    planId: keyof typeof STRIPE_PLANS,
    userId: string,
    successUrl: string,
    cancelUrl: string,
  ) {
    if (!this.stripe) throw new Error('Billing not configured. Set STRIPE_SECRET_KEY for managed mode.');

    const priceId = STRIPE_PLANS[planId];
    if (!priceId) throw new Error(`Invalid plan: ${planId}`);

    const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
    if (!tenant) throw new Error('Tenant not found');

    // Get or create Stripe customer
    let customerId = (tenant.settings as any)?.stripeCustomerId;
    if (!customerId) {
      const customer = await this.stripe.customers.create({
        name: tenant.name,
        metadata: { tenantId, tenantSlug: tenant.slug },
      });
      customerId = customer.id;

      await prisma.tenant.update({
        where: { id: tenantId },
        data: {
          settings: { ...(tenant.settings as object), stripeCustomerId: customerId },
        },
      });
    }

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { tenantId, userId },
      subscription_data: {
        trial_period_days: 14,
        metadata: { tenantId },
      },
    });

    await createAuditLog({
      tenantId,
      actorType: 'user',
      actorId: userId,
      action: 'tenant.settings_updated' as any,
      resource: 'billing',
      resourceId: session.id,
      details: { action: 'checkout_created', planId },
    });

    return { checkoutUrl: session.url, sessionId: session.id };
  }

  async handleWebhook(payload: string, signature: string) {
    if (!this.stripe) return;

    const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
    if (!webhookSecret) throw new Error('STRIPE_WEBHOOK_SECRET not configured');

    const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const tenantId = session.metadata?.tenantId;
        if (tenantId) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              settings: {
                ...(await prisma.tenant.findFirst({ where: { id: tenantId } }).then((t) => (t?.settings as object) ?? {})),
                stripeSubscriptionId: session.subscription,
                plan: 'professional',
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
              },
            },
          });
          logger.info({ tenantId }, 'Subscription created');
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = invoice.subscription;
        logger.info({ subscriptionId }, 'Invoice paid');
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const tenantId = invoice.metadata?.tenantId;
        logger.warn({ tenantId }, 'Payment failed');
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const tenantId = subscription.metadata?.tenantId;
        if (tenantId) {
          await prisma.tenant.update({
            where: { id: tenantId },
            data: {
              settings: {
                ...(await prisma.tenant.findFirst({ where: { id: tenantId } }).then((t) => (t?.settings as object) ?? {})),
                plan: 'community',
                stripeSubscriptionId: null,
              },
            },
          });
          logger.info({ tenantId }, 'Subscription cancelled — downgraded to community');
        }
        break;
      }

      default:
        logger.debug({ type: event.type }, 'Unhandled Stripe event');
    }
  }

  async createCustomerPortalSession(tenantId: string) {
    if (!this.stripe) throw new Error('Billing not configured');

    const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
    const customerId = (tenant?.settings as any)?.stripeCustomerId;
    if (!customerId) throw new Error('No billing account found');

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env['NEXTAUTH_URL'] ?? 'http://localhost:3000'}/settings/billing`,
    });

    return { portalUrl: session.url };
  }

  async getCurrentPlan(tenantId: string) {
    const tenant = await prisma.tenant.findFirst({ where: { id: tenantId } });
    const settings = tenant?.settings as any;

    return {
      plan: settings?.plan ?? 'community',
      stripeSubscriptionId: settings?.stripeSubscriptionId ?? null,
      trialEndsAt: settings?.trialEndsAt ?? null,
      isTrialing: settings?.trialEndsAt ? new Date(settings.trialEndsAt) > new Date() : false,
    };
  }
}
