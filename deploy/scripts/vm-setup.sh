#!/bin/bash
set -e
echo "=== Installing Node.js 22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo bash -
sudo apt-get install -y nodejs git
echo "Node: $(node --version)"

echo "=== Installing OpenClaw ==="
sudo npm install -g openclaw@latest pnpm@9 tsx
echo "OpenClaw version: $(openclaw --version 2>/dev/null || echo 'pending')"

echo "=== Cloning RisksRadarAI ==="
sudo git clone https://github.com/smaan712gb/RiskRadar.git /opt/riskradar 2>/dev/null || (cd /opt/riskradar && sudo git pull)

echo "=== Configuring OpenClaw Workspace ==="
mkdir -p ~/.openclaw/skills
cp /opt/riskradar/apps/agents/openclaw/SOUL.md ~/.openclaw/
cp /opt/riskradar/apps/agents/openclaw/AGENTS.md ~/.openclaw/
cp /opt/riskradar/apps/agents/openclaw/openclaw.json ~/.openclaw/

for s in /opt/riskradar/apps/agents/openclaw/skills/*.md; do
  N=$(basename "$s" | sed 's/-SKILL.md//')
  mkdir -p ~/.openclaw/skills/$N
  cp "$s" ~/.openclaw/skills/$N/SKILL.md
  echo "  Installed skill: $N"
done

echo "Skills: $(ls ~/.openclaw/skills/ | wc -l)"
echo ""
echo "=== SETUP COMPLETE ==="
echo "Node: $(node --version)"
echo "OpenClaw: $(which openclaw 2>/dev/null || echo 'not in PATH')"
echo "Workspace: ~/.openclaw"
echo "Skills: $(ls ~/.openclaw/skills/ 2>/dev/null | tr '\n' ' ')"
