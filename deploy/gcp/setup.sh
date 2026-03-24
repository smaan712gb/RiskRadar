#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar GCP Infrastructure Setup
# Creates Cloud SQL, Memorystore, Cloud Run services, and secrets
#
# Prerequisites:
#   - gcloud CLI authenticated
#   - GCP project selected
#   - APIs enabled: Cloud Run, Cloud SQL, Memorystore, Secret Manager, Cloud Build
# ─────────────────────────────────────────────────────────────

PROJECT_ID=$(gcloud config get-value project)
REGION="${GCP_REGION:-us-central1}"
DB_INSTANCE="riskradar-db"
DB_NAME="riskradar"
DB_USER="riskradar"
REDIS_INSTANCE="riskradar-redis"

echo "=== RiskRadar GCP Setup ==="
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo ""

# ─── Enable APIs ─────────────────────────────────────────────
echo "[1/7] Enabling required APIs..."
gcloud services enable \
  run.googleapis.com \
  sqladmin.googleapis.com \
  redis.googleapis.com \
  secretmanager.googleapis.com \
  cloudbuild.googleapis.com \
  containerregistry.googleapis.com \
  --quiet

# ─── Cloud SQL (PostgreSQL 16) ───────────────────────────────
echo "[2/7] Creating Cloud SQL instance..."
if ! gcloud sql instances describe $DB_INSTANCE --quiet 2>/dev/null; then
  gcloud sql instances create $DB_INSTANCE \
    --database-version=POSTGRES_16 \
    --tier=db-custom-2-8192 \
    --region=$REGION \
    --storage-size=50GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --availability-type=zonal \
    --database-flags=max_connections=200 \
    --quiet

  # Create database and user
  DB_PASSWORD=$(openssl rand -hex 16)
  gcloud sql databases create $DB_NAME --instance=$DB_INSTANCE --quiet
  gcloud sql users create $DB_USER --instance=$DB_INSTANCE --password=$DB_PASSWORD --quiet

  # Store connection string in Secret Manager
  DB_CONNECTION_NAME=$(gcloud sql instances describe $DB_INSTANCE --format='value(connectionName)')
  DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

  echo -n "$DB_URL" | gcloud secrets create riskradar-db-url --data-file=- --quiet 2>/dev/null || \
    echo -n "$DB_URL" | gcloud secrets versions add riskradar-db-url --data-file=- --quiet

  echo "  Cloud SQL created. Connection: $DB_CONNECTION_NAME"
else
  echo "  Cloud SQL instance already exists."
fi

# ─── Memorystore (Redis) ────────────────────────────────────
echo "[3/7] Creating Memorystore Redis instance..."
if ! gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --quiet 2>/dev/null; then
  gcloud redis instances create $REDIS_INSTANCE \
    --region=$REGION \
    --size=1 \
    --tier=basic \
    --redis-version=redis_7_0 \
    --quiet

  REDIS_HOST=$(gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format='value(host)')
  REDIS_PORT=$(gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --format='value(port)')
  REDIS_URL="redis://${REDIS_HOST}:${REDIS_PORT}"

  echo -n "$REDIS_URL" | gcloud secrets create riskradar-redis-url --data-file=- --quiet 2>/dev/null || \
    echo -n "$REDIS_URL" | gcloud secrets versions add riskradar-redis-url --data-file=- --quiet

  echo "  Memorystore Redis created at $REDIS_HOST:$REDIS_PORT"
else
  echo "  Memorystore Redis already exists."
fi

# ─── Secrets ─────────────────────────────────────────────────
echo "[4/7] Creating secrets..."
JWT_SECRET=$(openssl rand -hex 32)
ENCRYPTION_KEY=$(openssl rand -hex 16)

echo -n "$JWT_SECRET" | gcloud secrets create riskradar-jwt-secret --data-file=- --quiet 2>/dev/null || echo "  JWT secret exists"
echo -n "$ENCRYPTION_KEY" | gcloud secrets create riskradar-encryption-key --data-file=- --quiet 2>/dev/null || echo "  Encryption key exists"

# ─── Cloud Build Trigger ─────────────────────────────────────
echo "[5/7] Setting up Cloud Build..."
echo "  Connect your GitHub repo to Cloud Build in the GCP Console:"
echo "  https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
echo "  Use deploy/gcp/cloudbuild.yaml as the build config."

# ─── Grant Cloud Run access to secrets and Cloud SQL ─────────
echo "[6/7] Configuring IAM permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
CLOUD_RUN_SA="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding riskradar-db-url \
  --member="serviceAccount:${CLOUD_RUN_SA}" --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
gcloud secrets add-iam-policy-binding riskradar-redis-url \
  --member="serviceAccount:${CLOUD_RUN_SA}" --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
gcloud secrets add-iam-policy-binding riskradar-jwt-secret \
  --member="serviceAccount:${CLOUD_RUN_SA}" --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true
gcloud secrets add-iam-policy-binding riskradar-encryption-key \
  --member="serviceAccount:${CLOUD_RUN_SA}" --role="roles/secretmanager.secretAccessor" --quiet 2>/dev/null || true

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${CLOUD_RUN_SA}" --role="roles/cloudsql.client" --quiet 2>/dev/null || true

# ─── Domain Mapping ──────────────────────────────────────────
echo "[7/7] Domain setup..."
echo "  To map custom domains, run:"
echo "  gcloud run domain-mappings create --service=riskradar-api --domain=api.riskradar.io --region=$REGION"
echo "  gcloud run domain-mappings create --service=riskradar-web --domain=app.riskradar.io --region=$REGION"
echo ""
echo "  Then add the DNS records shown to your domain registrar."

echo ""
echo "=== GCP Setup Complete ==="
echo ""
echo "Next steps:"
echo "  1. Connect GitHub repo to Cloud Build triggers"
echo "  2. Run: gcloud builds submit --config=deploy/gcp/cloudbuild.yaml"
echo "  3. Run database migrations against Cloud SQL"
echo "  4. Map custom domains"
echo "  5. Configure Stripe webhook URL to: https://api.riskradar.io/api/v1/billing/webhook"
