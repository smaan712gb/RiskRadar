#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar — Deploy to GCP (amadds102025)
# One-command deploy of API + Web to Cloud Run
#
# Usage: ./deploy.sh [staging|production]
# ─────────────────────────────────────────────────────────────

ENV="${1:-staging}"
PROJECT_ID="amadds102025"
REGION="us-central1"

echo "=== RiskRadar Deploy to GCP ==="
echo "Project: $PROJECT_ID"
echo "Environment: $ENV"
echo "Region: $REGION"
echo ""

gcloud config set project $PROJECT_ID

# ─── Build & Push Images ────────────────────────────────────
echo "[1/5] Building Docker images..."
COMMIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "latest")

# Build API
docker build -t gcr.io/$PROJECT_ID/riskradar-api:$COMMIT_SHA \
  -t gcr.io/$PROJECT_ID/riskradar-api:latest \
  -f deploy/docker/Dockerfile.api . 2>&1 | tail -3

# Build Web
docker build -t gcr.io/$PROJECT_ID/riskradar-web:$COMMIT_SHA \
  -t gcr.io/$PROJECT_ID/riskradar-web:latest \
  -f deploy/docker/Dockerfile.web . 2>&1 | tail -3

echo "[2/5] Pushing images to GCR..."
docker push gcr.io/$PROJECT_ID/riskradar-api:$COMMIT_SHA
docker push gcr.io/$PROJECT_ID/riskradar-api:latest
docker push gcr.io/$PROJECT_ID/riskradar-web:$COMMIT_SHA
docker push gcr.io/$PROJECT_ID/riskradar-web:latest

# ─── Deploy API ──────────────────────────────────────────────
echo "[3/5] Deploying API to Cloud Run..."
gcloud run deploy riskradar-api \
  --image=gcr.io/$PROJECT_ID/riskradar-api:$COMMIT_SHA \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=2Gi \
  --cpu=2 \
  --min-instances=1 \
  --max-instances=10 \
  --port=3001 \
  --set-env-vars="NODE_ENV=production,LOG_LEVEL=info,API_HOST=0.0.0.0,API_PORT=3001" \
  --set-secrets="DATABASE_URL=riskradar-db-url:latest,REDIS_URL=riskradar-redis-url:latest,JWT_SECRET=riskradar-jwt-secret:latest,ENCRYPTION_KEY=riskradar-encryption-key:latest" \
  --quiet

API_URL=$(gcloud run services describe riskradar-api --region=$REGION --format='value(status.url)')
echo "  API deployed: $API_URL"

# ─── Deploy Web ──────────────────────────────────────────────
echo "[4/5] Deploying Web to Cloud Run..."
gcloud run deploy riskradar-web \
  --image=gcr.io/$PROJECT_ID/riskradar-web:$COMMIT_SHA \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --memory=1Gi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --port=3000 \
  --set-env-vars="NODE_ENV=production,NEXT_PUBLIC_API_URL=${API_URL}/api/v1" \
  --quiet

WEB_URL=$(gcloud run services describe riskradar-web --region=$REGION --format='value(status.url)')
echo "  Web deployed: $WEB_URL"

# ─── Run Migrations ──────────────────────────────────────────
echo "[5/5] Running database migrations..."
gcloud run jobs create riskradar-migrate \
  --image=gcr.io/$PROJECT_ID/riskradar-api:$COMMIT_SHA \
  --region=$REGION \
  --set-secrets="DATABASE_URL=riskradar-db-url:latest" \
  --command="npx" \
  --args="prisma,migrate,deploy,--schema=packages/database/prisma/schema.prisma" \
  --quiet 2>/dev/null || true

gcloud run jobs execute riskradar-migrate --region=$REGION --quiet 2>/dev/null || echo "  Run migrations manually if this fails."

echo ""
echo "=== Deployment Complete ==="
echo ""
echo "  API:       $API_URL"
echo "  Dashboard: $WEB_URL"
echo "  API Docs:  $API_URL/docs"
echo ""
echo "  Custom domains:"
echo "    gcloud run domain-mappings create --service=riskradar-api --domain=api.riskradar.aigovhub.io --region=$REGION"
echo "    gcloud run domain-mappings create --service=riskradar-web --domain=riskradar.aigovhub.io --region=$REGION"
