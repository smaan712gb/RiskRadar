#!/bin/bash
# RisksRadarAI — OpenClaw Agent E2E Test Suite

DEEPSEEK_KEY="${DEEPSEEK_API_KEY:-$1}"
export DEEPSEEK_API_KEY="$DEEPSEEK_KEY"

echo "======================================================"
echo "  RisksRadarAI OpenClaw Agent E2E Tests"
echo "======================================================"

PASS=0; FAIL=0
t() { if [ "$2" = "PASS" ]; then PASS=$((PASS+1)); echo "  [PASS] $1"; else FAIL=$((FAIL+1)); echo "  [FAIL] $1 -- $2"; fi; }

# Restart gateway
pkill -f "openclaw gateway" 2>/dev/null; sleep 2
nohup openclaw gateway > /tmp/openclaw.log 2>&1 &
sleep 8

echo ""
echo "--- 1. GATEWAY ---"
pgrep -f "openclaw-gateway" > /dev/null && t "Gateway running" "PASS" || t "Gateway" "NOT RUNNING"
grep -q "deepseek" /tmp/openclaw.log && t "Model: DeepSeek" "PASS" || t "Model" "wrong"
grep -q "listening" /tmp/openclaw.log && t "WebSocket listening" "PASS" || t "WebSocket" "not listening"

echo ""
echo "--- 2. AGENTS (13 expected) ---"
AGENT_LIST=$(openclaw agents list 2>&1)
AGENT_COUNT=$(echo "$AGENT_LIST" | grep -c "deepseek/deepseek-chat")
[ "$AGENT_COUNT" -ge 12 ] && t "$AGENT_COUNT agents registered" "PASS" || t "Agent count" "only $AGENT_COUNT"

for a in finance-collector security-collector hr-collector operations-collector communications-collector fusion-agent regulatory-watchdog trajectory-engine bias-check alert-router notification-agent sar-generator; do
  echo "$AGENT_LIST" | grep -q "$a" && t "Agent: $a" "PASS" || t "Agent: $a" "MISSING"
done

echo ""
echo "--- 3. WORKSPACES ---"
for a in finance-collector regulatory-watchdog fusion-agent sar-generator; do
  [ -f ~/.openclaw/agents/$a/SOUL.md ] && t "$a SOUL.md" "PASS" || t "$a SOUL.md" "MISSING"
done

echo ""
echo "--- 4. MCP ---"
MCP=$(openclaw mcp list 2>&1)
echo "$MCP" | grep -q "postgres" && t "MCP: postgres" "PASS" || t "MCP postgres" "MISSING"
echo "$MCP" | grep -q "web-search" && t "MCP: web-search" "PASS" || t "MCP web-search" "MISSING"
echo "$MCP" | grep -q "filesystem" && t "MCP: filesystem" "PASS" || t "MCP filesystem" "MISSING"

echo ""
echo "--- 5. SKILLS ---"
SKILL_COUNT=$(ls ~/.openclaw/skills/ 2>/dev/null | wc -l)
[ "$SKILL_COUNT" = "7" ] && t "7 skills" "PASS" || t "Skills" "$SKILL_COUNT"

echo ""
echo "--- 6. MEMORY ---"
openclaw memory status 2>&1 | grep -q "finance-collector" && t "Memory stores exist" "PASS" || t "Memory" "missing"

echo ""
echo "--- 7. AI: Regulatory Watchdog ---"
R1=$(curl -sf -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_KEY" \
  -d '{"model":"deepseek-chat","messages":[{"role":"system","content":"You are a BSA/AML regulatory watchdog. Assess impact of regulatory changes and propose policy updates."},{"role":"user","content":"New FinCEN advisory requires monitoring wire transfers over $3,000 to new accounts. Current threshold is $5,000. Propose policy update."}],"max_tokens":400,"temperature":0.1}')
A1=$(echo "$R1" | python3 -c "import sys,json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null)
[ -n "$A1" ] && t "Watchdog AI responds (${#A1} chars)" "PASS" || t "Watchdog AI" "empty"
echo "$A1" | grep -qi "3,000\|threshold\|update\|policy" && t "Proposes threshold change" "PASS" || t "Proposal quality" "weak"
echo "  Preview: ${A1:0:200}..."

echo ""
echo "--- 8. AI: Finance Forensics ---"
R2=$(curl -sf -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_KEY" \
  -d '{"model":"deepseek-chat","messages":[{"role":"system","content":"You are a CFE/CAMS-level financial crime analyst. Detect fraud patterns using transaction forensics."},{"role":"user","content":"Employee EMP-4821: 3 wire overrides ($52K,$48.5K,$67K) during supervisor PTO, after-hours access at 11:47PM, 2 new payees created same day, missed AML training. Assess compound risk."}],"max_tokens":400,"temperature":0.1}')
A2=$(echo "$R2" | python3 -c "import sys,json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null)
[ -n "$A2" ] && t "Finance AI responds (${#A2} chars)" "PASS" || t "Finance AI" "empty"
echo "$A2" | grep -qi "suspicious\|risk\|override\|SAR" && t "Detects compound risk" "PASS" || t "Detection" "weak"
echo "  Preview: ${A2:0:200}..."

echo ""
echo "--- 9. AI: SAR Draft ---"
R3=$(curl -sf -X POST https://api.deepseek.com/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $DEEPSEEK_KEY" \
  -d '{"model":"deepseek-chat","messages":[{"role":"system","content":"Generate SAR narrative in FinCEN format. Third person, past tense, formal language. Include who, what, when, where, why."},{"role":"user","content":"Draft SAR for EMP-4821: 3 override wires totaling $167,500 to new accounts during supervisor absence, after-hours access Mar 14 2026 at 11:47PM."}],"max_tokens":500,"temperature":0.1}')
A3=$(echo "$R3" | python3 -c "import sys,json; print(json.load(sys.stdin)['choices'][0]['message']['content'])" 2>/dev/null)
[ -n "$A3" ] && t "SAR AI responds (${#A3} chars)" "PASS" || t "SAR AI" "empty"
echo "$A3" | grep -qi "167,500\|wire\|override\|March" && t "SAR has specifics" "PASS" || t "SAR detail" "weak"
echo "  Preview: ${A3:0:300}..."

echo ""
echo "--- 10. LIVE API ---"
API="https://risksradarai.com/api/v1"
curl -sf $API/health | grep -q "ok" && t "API health" "PASS" || t "API" "down"
TOKEN=$(curl -sf -X POST $API/auth/login -H "Content-Type: application/json" -d '{"tenantSlug":"demo-bank","email":"smaan2011@gmail.com","password":"Pakistan2026"}' | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
[ -n "$TOKEN" ] && t "API auth" "PASS" || t "Auth" "failed"
for ep in alerts cases signals policies risk-scores integrations users audit-logs; do
  curl -sf "$API/$ep" -H "Authorization: Bearer $TOKEN" | grep -q "success" && t "API /$ep" "PASS" || t "API /$ep" "failed"
done

echo ""
echo "--- 11. DASHBOARD ---"
for p in "" pricing login signup about contact security privacy terms overview alerts cases risk-scores signals policies agents audit-log settings onboarding; do
  CODE=$(curl -sf -o /dev/null -w '%{http_code}' -L "https://risksradarai.com/$p" 2>/dev/null)
  [ "$CODE" = "200" ] && t "Page /$p" "PASS" || t "Page /$p" "HTTP $CODE"
done

echo ""
echo "======================================================"
TOTAL=$((PASS+FAIL))
RATE=$((PASS*100/TOTAL))
echo "  RESULTS: $PASS/$TOTAL PASSED ($RATE%)"
echo "  Failed: $FAIL"
echo "======================================================"
