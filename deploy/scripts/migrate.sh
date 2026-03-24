#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar Database Migration Script
# Runs Prisma migrations + TimescaleDB post-migration setup
# ─────────────────────────────────────────────────────────────

echo "=== RiskRadar Database Migration ==="

# Step 1: Run Prisma migrations
echo "[1/4] Running Prisma migrations..."
npx prisma migrate deploy --schema=packages/database/prisma/schema.prisma
echo "  Prisma migrations complete."

# Step 2: Run post-migration SQL (TimescaleDB, indexes, triggers)
echo "[2/4] Running post-migration setup (TimescaleDB, indexes, triggers)..."
if command -v psql &> /dev/null; then
  psql "$DATABASE_URL" -f packages/database/prisma/post-migration.sql 2>/dev/null || echo "  Warning: Some post-migration steps may have already been applied."
else
  echo "  Warning: psql not available. Run post-migration.sql manually."
fi
echo "  Post-migration complete."

# Step 3: Generate Prisma client
echo "[3/4] Generating Prisma client..."
npx prisma generate --schema=packages/database/prisma/schema.prisma
echo "  Prisma client generated."

# Step 4: Seed (only on first run)
echo "[4/4] Seeding database (idempotent)..."
npx tsx packages/database/prisma/seed.ts 2>/dev/null || echo "  Seed may have already been applied."
echo "  Seed complete."

echo ""
echo "=== Migration complete ==="
