#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar — One-Command Self-Hosted Installation
#
# Usage:
#   curl -fsSL https://get.riskradar.io | bash
#   OR
#   ./install.sh [--mode local|cloud|hybrid] [--no-gpu]
# ─────────────────────────────────────────────────────────────

BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

INFERENCE_MODE="cloud"
HAS_GPU=false
INSTALL_DIR="${RISKRADAR_HOME:-/opt/riskradar}"

echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║   RiskRadar — AI Risk Intelligence Platform             ║${NC}"
echo -e "${BOLD}║   Self-Hosted Installation                              ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# ─── Parse Arguments ─────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case $1 in
    --mode) INFERENCE_MODE="$2"; shift 2 ;;
    --no-gpu) HAS_GPU=false; shift ;;
    --dir) INSTALL_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# ─── Check Prerequisites ────────────────────────────────────
echo -e "${BOLD}Checking prerequisites...${NC}"

check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}✗ $1 not found. Please install $1 first.${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ $1${NC}"
}

check_cmd docker
check_cmd docker

# Check Docker Compose
if docker compose version &> /dev/null; then
  echo -e "${GREEN}✓ docker compose${NC}"
  COMPOSE_CMD="docker compose"
elif command -v docker-compose &> /dev/null; then
  echo -e "${GREEN}✓ docker-compose${NC}"
  COMPOSE_CMD="docker-compose"
else
  echo -e "${RED}✗ Docker Compose not found${NC}"
  exit 1
fi

# Check for NVIDIA GPU
if command -v nvidia-smi &> /dev/null; then
  GPU_INFO=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader 2>/dev/null || true)
  if [ -n "$GPU_INFO" ]; then
    HAS_GPU=true
    echo -e "${GREEN}✓ NVIDIA GPU detected: ${GPU_INFO}${NC}"
  fi
else
  echo -e "${YELLOW}⚠ No NVIDIA GPU detected. Will use cloud inference mode.${NC}"
  INFERENCE_MODE="cloud"
fi

# ─── Setup ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}Setting up RiskRadar in ${INSTALL_DIR}...${NC}"

mkdir -p "$INSTALL_DIR"
cd "$INSTALL_DIR"

# Clone or pull latest
if [ -d ".git" ]; then
  echo "Updating existing installation..."
  git pull origin main
else
  echo "Downloading RiskRadar..."
  git clone https://github.com/smaan712gb/RiskRadar.git .
fi

# ─── Generate Secrets ────────────────────────────────────────
if [ ! -f "deploy/docker/.env" ]; then
  echo -e "${BOLD}Generating secure configuration...${NC}"
  cp deploy/docker/.env.example deploy/docker/.env

  # Generate random secrets
  DB_PASS=$(openssl rand -hex 16)
  REDIS_PASS=$(openssl rand -hex 16)
  JWT_SEC=$(openssl rand -hex 32)
  ENC_KEY=$(openssl rand -hex 16)

  sed -i "s/CHANGE_ME_STRONG_PASSWORD_HERE/${DB_PASS}/" deploy/docker/.env
  sed -i "s/CHANGE_ME_STRONG_PASSWORD_HERE/${REDIS_PASS}/" deploy/docker/.env
  sed -i "s/CHANGE_ME_64_CHAR_RANDOM_STRING_GENERATED_WITH_openssl_rand_hex_32/${JWT_SEC}/" deploy/docker/.env
  sed -i "s/CHANGE_ME_32_CHAR_HEX_STRING_FOR_AES256_ENCRYPTION/${ENC_KEY}/" deploy/docker/.env
  sed -i "s/INFERENCE_MODE=local/INFERENCE_MODE=${INFERENCE_MODE}/" deploy/docker/.env

  echo -e "${GREEN}✓ Secrets generated${NC}"
else
  echo -e "${YELLOW}⚠ Config already exists, keeping existing .env${NC}"
fi

# ─── Build & Start ───────────────────────────────────────────
echo ""
echo -e "${BOLD}Building containers...${NC}"

cd deploy/docker

BUILD_ARGS=""
if [ "$HAS_GPU" = true ] && [ "$INFERENCE_MODE" = "local" ]; then
  echo -e "${GREEN}GPU mode: Starting with local inference engine${NC}"
  $COMPOSE_CMD -f docker-compose.production.yml --profile gpu build
  $COMPOSE_CMD -f docker-compose.production.yml --profile gpu up -d
else
  echo -e "${YELLOW}Cloud mode: No local inference engine (configure API keys in .env)${NC}"
  $COMPOSE_CMD -f docker-compose.production.yml build
  $COMPOSE_CMD -f docker-compose.production.yml up -d
fi

# ─── Wait for Services ──────────────────────────────────────
echo ""
echo -e "${BOLD}Waiting for services to start...${NC}"

for i in $(seq 1 30); do
  if curl -sf http://localhost:3001/api/v1/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ API is healthy${NC}"
    break
  fi
  echo "  Waiting... ($i/30)"
  sleep 2
done

# ─── Run Migrations & Seed ──────────────────────────────────
echo -e "${BOLD}Running database migrations...${NC}"
$COMPOSE_CMD -f docker-compose.production.yml exec api npx prisma migrate deploy 2>/dev/null || true
$COMPOSE_CMD -f docker-compose.production.yml exec api npx prisma db seed 2>/dev/null || true

echo -e "${GREEN}✓ Database initialized${NC}"

# ─── Done ────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║   RiskRadar is running!                                 ║${NC}"
echo -e "${BOLD}${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${BOLD}${GREEN}║                                                          ║${NC}"
echo -e "${BOLD}${GREEN}║   Dashboard:  http://localhost:3000                      ║${NC}"
echo -e "${BOLD}${GREEN}║   API:        http://localhost:3001                      ║${NC}"
echo -e "${BOLD}${GREEN}║   API Docs:   http://localhost:3001/docs                 ║${NC}"
echo -e "${BOLD}${GREEN}║                                                          ║${NC}"
echo -e "${BOLD}${GREEN}║   Default login:                                         ║${NC}"
echo -e "${BOLD}${GREEN}║     Email:    admin@riskradar.dev                        ║${NC}"
echo -e "${BOLD}${GREEN}║     Password: admin123!                                  ║${NC}"
echo -e "${BOLD}${GREEN}║                                                          ║${NC}"
echo -e "${BOLD}${GREEN}║   Inference:  ${INFERENCE_MODE}$([ "$HAS_GPU" = true ] && echo " (GPU)" || echo "")                                       ║${NC}"
echo -e "${BOLD}${GREEN}║                                                          ║${NC}"
echo -e "${BOLD}${GREEN}║   ⚠  Change default password immediately!               ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo "Configuration: ${INSTALL_DIR}/deploy/docker/.env"
echo "Logs:          docker compose -f deploy/docker/docker-compose.production.yml logs -f"
echo "Stop:          docker compose -f deploy/docker/docker-compose.production.yml down"
