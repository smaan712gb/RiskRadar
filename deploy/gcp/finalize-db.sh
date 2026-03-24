#!/bin/bash
# Run this after Cloud SQL is created
# Creates database, user, and stores connection string

GCLOUD_BAT="/tmp/gcloud_run.bat"
PROJECT_ID="amadds102025"
DB_INSTANCE="riskradar-db"
DB_NAME="riskradar"
DB_USER="riskradar"
DB_PASSWORD=$(openssl rand -hex 16)

echo "Creating database and user..."
$GCLOUD_BAT sql databases create $DB_NAME --instance=$DB_INSTANCE --quiet 2>&1
$GCLOUD_BAT sql users create $DB_USER --instance=$DB_INSTANCE --password=$DB_PASSWORD --quiet 2>&1

DB_CONNECTION_NAME=$($GCLOUD_BAT sql instances describe $DB_INSTANCE --format="value(connectionName)" 2>&1)
DB_URL="postgresql://${DB_USER}:${DB_PASSWORD}@/${DB_NAME}?host=/cloudsql/${DB_CONNECTION_NAME}"

echo "Storing connection string in Secret Manager..."
echo -n "$DB_URL" | $GCLOUD_BAT secrets create riskradar-db-url --data-file=- --quiet 2>&1

echo ""
echo "Database ready:"
echo "  Instance: $DB_INSTANCE"
echo "  Connection: $DB_CONNECTION_NAME"
echo "  Database: $DB_NAME"
echo "  User: $DB_USER"

# Grant Cloud Run SA access to this new secret
$GCLOUD_BAT secrets add-iam-policy-binding riskradar-db-url \
  --member="serviceAccount:680928579719-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor" --quiet 2>&1

echo "  Secret access granted to Cloud Run"
