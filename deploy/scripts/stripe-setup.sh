#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar Stripe Product Setup
# Creates products and prices in your Stripe account
#
# Prerequisites:
#   - Stripe CLI installed (https://stripe.com/docs/stripe-cli)
#   - Authenticated: stripe login
# ─────────────────────────────────────────────────────────────

echo "=== RiskRadar Stripe Setup ==="
echo ""

# Check Stripe CLI
if ! command -v stripe &> /dev/null; then
  echo "Stripe CLI not found. Install from: https://stripe.com/docs/stripe-cli"
  exit 1
fi

# ─── Create Products ─────────────────────────────────────────
echo "[1/4] Creating products..."

# Professional Plan
PRO_PRODUCT=$(stripe products create \
  --name="RiskRadar Professional" \
  --description="Managed cloud + enterprise AI features. Auto-learning, regulatory watchdog, SAR generation, NL policies." \
  --metadata[tier]="professional" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Professional product: $PRO_PRODUCT"

# Enterprise Plan
ENT_PRODUCT=$(stripe products create \
  --name="RiskRadar Enterprise" \
  --description="On-prem, hybrid, or dedicated cloud. Full control with dedicated support." \
  --metadata[tier]="enterprise" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Enterprise product: $ENT_PRODUCT"

# ─── Create Prices ───────────────────────────────────────────
echo "[2/4] Creating prices..."

# Professional Monthly ($2,500/month)
PRO_MONTHLY=$(stripe prices create \
  --product="$PRO_PRODUCT" \
  --unit-amount=250000 \
  --currency=usd \
  --recurring[interval]=month \
  --metadata[plan]="professional_monthly" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Professional Monthly: $PRO_MONTHLY"

# Professional Annual ($25,000/year — 2 months free)
PRO_ANNUAL=$(stripe prices create \
  --product="$PRO_PRODUCT" \
  --unit-amount=2500000 \
  --currency=usd \
  --recurring[interval]=year \
  --metadata[plan]="professional_annual" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Professional Annual: $PRO_ANNUAL"

# Enterprise Monthly ($20,000/month — starting price)
ENT_MONTHLY=$(stripe prices create \
  --product="$ENT_PRODUCT" \
  --unit-amount=2000000 \
  --currency=usd \
  --recurring[interval]=month \
  --metadata[plan]="enterprise_monthly" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Enterprise Monthly: $ENT_MONTHLY"

# Enterprise Annual ($200,000/year)
ENT_ANNUAL=$(stripe prices create \
  --product="$ENT_PRODUCT" \
  --unit-amount=20000000 \
  --currency=usd \
  --recurring[interval]=year \
  --metadata[plan]="enterprise_annual" \
  --format=json | grep -o '"id": "[^"]*"' | head -1 | cut -d'"' -f4)
echo "  Enterprise Annual: $ENT_ANNUAL"

# ─── Create Customer Portal ──────────────────────────────────
echo "[3/4] Configuring customer portal..."
echo "  Configure at: https://dashboard.stripe.com/settings/billing/portal"
echo "  Enable: cancel subscription, switch plans, update payment method"

# ─── Create Webhook ──────────────────────────────────────────
echo "[4/4] Webhook setup..."
echo ""
echo "  Create webhook at: https://dashboard.stripe.com/webhooks"
echo "  Endpoint URL: https://api.riskradar.io/api/v1/billing/webhook"
echo "  Events to listen for:"
echo "    - checkout.session.completed"
echo "    - invoice.paid"
echo "    - invoice.payment_failed"
echo "    - customer.subscription.deleted"
echo "    - customer.subscription.updated"
echo ""

# ─── Output Environment Variables ────────────────────────────
echo "=== Add to your .env ==="
echo ""
echo "STRIPE_PRICE_PRO_MONTHLY=$PRO_MONTHLY"
echo "STRIPE_PRICE_PRO_ANNUAL=$PRO_ANNUAL"
echo "STRIPE_PRICE_ENT_MONTHLY=$ENT_MONTHLY"
echo "STRIPE_PRICE_ENT_ANNUAL=$ENT_ANNUAL"
echo ""
echo "# Get these from Stripe Dashboard:"
echo "# STRIPE_SECRET_KEY=sk_live_..."
echo "# STRIPE_WEBHOOK_SECRET=whsec_..."
echo ""
echo "=== Stripe Setup Complete ==="
