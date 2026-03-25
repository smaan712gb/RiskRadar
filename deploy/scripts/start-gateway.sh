#!/bin/bash
# Start OpenClaw Gateway on the VM
# Usage: Pass DEEPSEEK_API_KEY as first argument

export DEEPSEEK_API_KEY="${1}"

echo "Setting up OpenClaw with DeepSeek..."
echo "Key: ${DEEPSEEK_API_KEY:0:10}..."

# Write config
cat > ~/.openclaw/openclaw.json << 'EOF'
{
  "name": "RisksRadarAI",
  "version": "0.1.0",
  "skills": {
    "directory": "~/.openclaw/skills",
    "autoload": true
  },
  "memory": {
    "enabled": true,
    "persistence": "local"
  }
}
EOF

echo "Config written."

# Kill existing gateway
pkill -f "openclaw" 2>/dev/null || true
sleep 2

# Start gateway
echo "Starting OpenClaw Gateway..."
nohup openclaw gateway > /var/log/openclaw-gateway.log 2>&1 &
GATEWAY_PID=$!
echo "Gateway PID: $GATEWAY_PID"

sleep 5

# Check
if kill -0 $GATEWAY_PID 2>/dev/null; then
  echo "Gateway is RUNNING (PID $GATEWAY_PID)"
else
  echo "Gateway FAILED to start"
fi

echo ""
echo "Log output:"
tail -10 /var/log/openclaw-gateway.log 2>/dev/null

echo ""
echo "OpenClaw version: $(openclaw --version 2>/dev/null)"
echo "Skills loaded: $(ls ~/.openclaw/skills/ 2>/dev/null | tr '\n' ' ')"
