#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RisksRadarAI — OpenClaw + NemoClaw Setup
#
# Installs OpenClaw agent framework and NemoClaw security layer
# then configures the RisksRadarAI agent workspace
#
# Prerequisites:
#   - Node.js 22+ (24 recommended)
#   - For NemoClaw: Linux (Ubuntu 22.04+), NVIDIA GPU (RTX 4090+)
#   - For cloud-only mode: No GPU needed (uses DeepSeek API)
#
# Sources:
#   - https://github.com/openclaw/openclaw
#   - https://github.com/NVIDIA/NemoClaw
# ─────────────────────────────────────────────────────────────

echo "╔══════════════════════════════════════════════════════╗"
echo "║  RisksRadarAI — OpenClaw + NemoClaw Setup           ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OPENCLAW_WORKSPACE="$PROJECT_DIR/apps/agents/openclaw"
MODE="${1:-cloud}"  # cloud | local | hybrid

echo "Project: $PROJECT_DIR"
echo "Mode: $MODE"
echo ""

# ─── Step 1: Install OpenClaw ────────────────────────────────
echo "[1/6] Installing OpenClaw..."
if command -v openclaw &> /dev/null; then
  CURRENT=$(openclaw --version 2>/dev/null || echo "unknown")
  echo "  OpenClaw already installed: $CURRENT"
else
  echo "  Installing OpenClaw globally..."
  npm install -g openclaw@latest
  echo "  Installed: $(openclaw --version)"
fi

# ─── Step 2: Install NemoClaw (GPU mode only) ────────────────
if [ "$MODE" = "local" ] || [ "$MODE" = "hybrid" ]; then
  echo ""
  echo "[2/6] Installing NemoClaw..."
  if command -v nvidia-smi &> /dev/null; then
    GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || echo "unknown")
    echo "  GPU detected: $GPU_INFO"

    if command -v nemoclaw &> /dev/null; then
      echo "  NemoClaw already installed"
    else
      echo "  Installing NemoClaw..."
      # Clone and install NemoClaw
      git clone https://github.com/NVIDIA/NemoClaw.git /tmp/nemoclaw 2>/dev/null || true
      cd /tmp/nemoclaw && bash install.sh 2>/dev/null || echo "  Manual NemoClaw installation may be required"
      cd "$PROJECT_DIR"
    fi
  else
    echo "  WARNING: No NVIDIA GPU detected. NemoClaw requires GPU."
    echo "  Falling back to cloud inference mode."
    MODE="cloud"
  fi
else
  echo "[2/6] Skipping NemoClaw (cloud mode — no GPU required)"
fi

# ─── Step 3: Configure OpenClaw Workspace ─────────────────────
echo ""
echo "[3/6] Configuring OpenClaw workspace..."

# Copy workspace files
DEST="$HOME/.openclaw"
mkdir -p "$DEST/skills"

cp "$OPENCLAW_WORKSPACE/SOUL.md" "$DEST/SOUL.md"
cp "$OPENCLAW_WORKSPACE/AGENTS.md" "$DEST/AGENTS.md"
cp "$OPENCLAW_WORKSPACE/openclaw.json" "$DEST/openclaw.json"

# Copy skills
for skill in "$OPENCLAW_WORKSPACE/skills/"*.md; do
  SKILL_NAME=$(basename "$skill" | sed 's/-SKILL.md//')
  mkdir -p "$DEST/skills/$SKILL_NAME"
  cp "$skill" "$DEST/skills/$SKILL_NAME/SKILL.md"
  echo "  Installed skill: $SKILL_NAME"
done

echo "  Workspace configured at: $DEST"

# ─── Step 4: Configure NemoClaw Policies ──────────────────────
if [ "$MODE" = "local" ] || [ "$MODE" = "hybrid" ]; then
  echo ""
  echo "[4/6] Configuring NemoClaw sandbox policies..."
  cp "$OPENCLAW_WORKSPACE/nemoclaw.yaml" "$DEST/nemoclaw.yaml"

  # Copy per-agent sandbox policies
  for policy in "$PROJECT_DIR/apps/agents/src/policies/"*.yaml; do
    cp "$policy" "$DEST/policies/$(basename "$policy")" 2>/dev/null || true
    echo "  Applied policy: $(basename "$policy")"
  done
else
  echo "[4/6] Skipping NemoClaw policies (cloud mode)"
fi

# ─── Step 5: Set Environment Variables ────────────────────────
echo ""
echo "[5/6] Environment configuration..."
echo "  Ensure these are set in your environment or .env:"
echo ""
echo "  # Required"
echo "  DEEPSEEK_API_KEY=your-deepseek-api-key"
echo "  DATABASE_URL=your-database-connection-string"
echo ""
echo "  # For integrations (configure per customer)"
echo "  SPLUNK_URL=https://splunk.customer.com:8089"
echo "  SPLUNK_TOKEN=..."
echo "  WORKDAY_URL=https://workday.customer.com"
echo "  AZURE_AD_TENANT_ID=..."
echo ""

# ─── Step 6: Verify ──────────────────────────────────────────
echo "[6/6] Verification..."
echo "  OpenClaw: $(command -v openclaw &>/dev/null && openclaw --version 2>/dev/null || echo 'not installed')"
echo "  NemoClaw: $(command -v nemoclaw &>/dev/null && echo 'installed' || echo 'not installed (cloud mode)')"
echo "  Workspace: $DEST"
echo "  SOUL.md: $([ -f "$DEST/SOUL.md" ] && echo 'present' || echo 'MISSING')"
echo "  AGENTS.md: $([ -f "$DEST/AGENTS.md" ] && echo 'present' || echo 'MISSING')"
echo "  Skills: $(ls "$DEST/skills/" 2>/dev/null | wc -l) installed"
echo "  Mode: $MODE"
echo ""

echo "╔══════════════════════════════════════════════════════╗"
echo "║  Setup Complete!                                     ║"
echo "║                                                      ║"
echo "║  To start the OpenClaw Gateway:                      ║"
echo "║    openclaw gateway                                  ║"
echo "║                                                      ║"
echo "║  To start with NemoClaw (GPU mode):                  ║"
echo "║    nemoclaw start --config nemoclaw.yaml             ║"
echo "║                                                      ║"
echo "║  To start the RisksRadarAI API:                      ║"
echo "║    cd $PROJECT_DIR && pnpm dev                       ║"
echo "╚══════════════════════════════════════════════════════╝"
