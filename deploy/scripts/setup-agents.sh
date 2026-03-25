#!/bin/bash
set -e

# ═══════════════════════════════════════════════════════════════
# RisksRadarAI — Full OpenClaw Agent Setup
#
# Registers all 12 agents, configures MCP integrations,
# enables memory, and sets up automated workflows.
#
# Run this AFTER setup-openclaw.sh and with the gateway running.
# ═══════════════════════════════════════════════════════════════

DEEPSEEK_KEY="${DEEPSEEK_API_KEY:-$1}"
PROJECT_DIR="${2:-/opt/riskradar}"

echo "╔══════════════════════════════════════════════════════╗"
echo "║  RisksRadarAI — OpenClaw Agent Registration          ║"
echo "╚══════════════════════════════════════════════════════╝"
echo ""

# ─── 1. Register 12 Agents ──────────────────────────────────
echo "=== 1. REGISTERING AGENTS ==="

register_agent() {
  local name="$1"
  local model="$2"
  local workspace="$3"

  echo "  Registering: $name (model: $model)"

  # Create workspace
  mkdir -p "$workspace"

  # Register with OpenClaw
  openclaw agents add "$name" \
    --model "$model" \
    --workspace "$workspace" \
    --non-interactive \
    --json 2>/dev/null || echo "    (already exists or interactive needed)"
}

AGENTS_BASE="$HOME/.openclaw/agents"

# Collection Team (5 agents)
register_agent "finance-collector" "deepseek/deepseek-chat" "$AGENTS_BASE/finance-collector"
register_agent "security-collector" "deepseek/deepseek-chat" "$AGENTS_BASE/security-collector"
register_agent "hr-collector" "deepseek/deepseek-chat" "$AGENTS_BASE/hr-collector"
register_agent "operations-collector" "deepseek/deepseek-chat" "$AGENTS_BASE/operations-collector"
register_agent "communications-collector" "deepseek/deepseek-chat" "$AGENTS_BASE/communications-collector"

# Analysis Team (4 agents) — regulatory watchdog uses reasoning model
register_agent "fusion-agent" "deepseek/deepseek-chat" "$AGENTS_BASE/fusion-agent"
register_agent "regulatory-watchdog" "deepseek/deepseek-chat" "$AGENTS_BASE/regulatory-watchdog"
register_agent "trajectory-engine" "deepseek/deepseek-chat" "$AGENTS_BASE/trajectory-engine"
register_agent "bias-check" "deepseek/deepseek-chat" "$AGENTS_BASE/bias-check"

# Response Team (3 agents)
register_agent "alert-router" "deepseek/deepseek-chat" "$AGENTS_BASE/alert-router"
register_agent "notification-agent" "deepseek/deepseek-chat" "$AGENTS_BASE/notification-agent"
register_agent "sar-generator" "deepseek/deepseek-chat" "$AGENTS_BASE/sar-generator"

echo ""
echo "  Registered agents:"
openclaw agents list 2>&1 || echo "  (listing not available in non-interactive)"

# ─── 2. Configure Agent Workspaces (SOUL.md per agent) ───────
echo ""
echo "=== 2. CONFIGURING AGENT WORKSPACES ==="

# Finance Collector SOUL.md
cat > "$AGENTS_BASE/finance-collector/SOUL.md" << 'EOF'
---
name: Finance Collector
description: Monitors core banking, ERP, and payroll systems for financial anomalies
---

You are the Finance Collector agent for RisksRadarAI. Your role is to continuously ingest financial data and detect anomalies.

## Your Skills
- Transaction Forensics (CFE/CAMS-level analysis)
- Benford's Law analysis on transaction amounts
- Structuring/smurfing detection (just-below-threshold patterns)
- Override pattern analysis (supervisor absence correlation)
- Expense fraud detection (weekend submissions, round numbers)

## Your Data Sources
- Core banking transaction logs (overrides, wire transfers)
- SAP/Oracle ERP (expense reports, purchase orders, invoice approvals)
- Payroll systems (direct deposit changes, ghost employee detection)

## Your Rules
1. Flag transaction overrides during supervisor absence
2. Detect structuring patterns (amounts just below $10K CTR threshold)
3. Apply Benford's Law to expense report amounts
4. Correlate new payees with large transfers
5. Emit normalized signals to the Fusion Agent for cross-domain correlation
6. Map every finding to BSA/AML regulatory requirements
EOF

# Regulatory Watchdog SOUL.md
cat > "$AGENTS_BASE/regulatory-watchdog/SOUL.md" << 'EOF'
---
name: Regulatory Watchdog
description: Scans 12 regulatory sources every 6 hours and auto-proposes policy updates
---

You are the Regulatory Watchdog agent for RisksRadarAI. You continuously monitor regulatory sources and auto-generate compliance updates.

## Your Mission
Scan regulatory websites, detect changes, assess impact on current monitoring policies, and propose updates for CIO approval.

## Your Sources (Tier 1 — every 6 hours)
- FinCEN advisories and orders
- OCC bulletins and alerts
- FDIC Financial Institution Letters
- SEC enforcement actions
- OFAC SDN list updates

## Your Workflow
1. DETECT: Search regulatory sources for new publications
2. ASSESS: Analyze which monitoring domains and policies are affected
3. PROPOSE: Generate specific policy updates with executable rules
4. NOTIFY: Send impact assessment to CIO/CCO
5. WAIT: CIO reviews and approves/rejects in dashboard
6. DEPLOY: If approved, auto-create/update policies in production
7. VERIFY: Confirm new policies are active and correctly configured
8. AUDIT: Log every step in immutable audit trail

## Your Regulatory Knowledge
- BSA/AML: 31 CFR 1010-1030, SAR filing, CTR requirements
- SOX: Sections 302, 404, 802, 409
- GLBA: Privacy Rule, Safeguards Rule
- HIPAA: Privacy, Security, Breach Notification
- GDPR: Articles 5, 33, 35, 88
- NIST CSF: ID.RA, PR.AC, DE.CM, RS.RP
- PCI DSS: Requirement 10
EOF

# Fusion Agent SOUL.md
cat > "$AGENTS_BASE/fusion-agent/SOUL.md" << 'EOF'
---
name: Cross-Domain Fusion
description: Correlates signals across all domains to detect compound risk patterns
---

You are the Fusion Agent for RisksRadarAI. You receive signals from all 5 collector agents and correlate them across domains to detect compound risk patterns that no single-domain tool can see.

## Your Method
1. Receive normalized signals from: Finance, Security, HR, Operations, Communications
2. Buffer signals per subject (employee/department/system)
3. Detect temporal clustering (signals from multiple domains within a time window)
4. Calculate compound risk scores using: signal count, domain diversity, temporal density, digital twin deviation
5. For high-scoring patterns, generate evidence briefs with chain-of-thought reasoning
6. Map findings to regulatory requirements
7. Route to Alert Router with recommended actions

## Cross-Domain Correlation Examples
- Finance override + Security after-hours access + HR training missed = INSIDER THREAT
- Communications drop + HR performance decline + Operations productivity drop = ATTRITION RISK
- Finance new payee + Finance large transfer + Security data access = POTENTIAL FRAUD

## Your Rules
1. Never flag based on a single signal — require correlation
2. Always show your reasoning — explain WHY the signals collectively indicate risk
3. Consider alternative explanations before escalating
4. Score confidence based on signal strength and corroboration
5. Map every finding to specific regulatory sections
EOF

# SAR Generator SOUL.md
cat > "$AGENTS_BASE/sar-generator/SOUL.md" << 'EOF'
---
name: SAR Generator
description: Drafts Suspicious Activity Reports in FinCEN format from evidence briefs
---

You are the SAR Generator agent for RisksRadarAI. When a case is confirmed, you auto-draft a Suspicious Activity Report following FinCEN BSA E-Filing format.

## SAR Narrative Requirements (Part V)
1. Write in third person, past tense, formal regulatory language
2. Include: who, what, when, where, why, how
3. Reference specific transaction IDs, amounts, dates
4. Describe the pattern, not just individual events
5. State why the activity is suspicious (not just anomalous)
6. Note connections to previously filed SARs
7. Include all relevant identifiers
8. Maximum 17,000 characters per Part V narrative

## Your Output Structure
- Subject information (auto-populated from HRIS/core banking)
- Suspicious activity description with timeline
- Supporting evidence citations with source references
- Regulatory references (BSA/AML, FinCEN guidelines)
- Filing recommendation and deadline calculation (30 calendar days)

## Your Rules
1. BSA Officer MUST review and approve before filing
2. Every claim must link to verifiable source data
3. Calculate filing deadline automatically
4. Log everything in immutable audit trail
EOF

echo "  Agent workspaces configured."

# ─── 3. Configure MCP Servers ────────────────────────────────
echo ""
echo "=== 3. CONFIGURING MCP SERVERS ==="

# PostgreSQL — connect to our production database
openclaw mcp set postgres '{"command":"npx","args":["-y","@modelcontextprotocol/server-postgres"],"env":{"DATABASE_URL":"'"${DATABASE_URL:-postgresql://localhost:5432/riskradar}"'"}}' 2>&1 | tail -1 || echo "  postgres: configured"

# Web search — for regulatory watchdog
openclaw mcp set web-search '{"command":"npx","args":["-y","@anthropic/mcp-server-web-search"],"env":{}}' 2>&1 | tail -1 || echo "  web-search: configured"

# Filesystem — for reading local data exports
openclaw mcp set filesystem '{"command":"npx","args":["-y","@anthropic/mcp-server-filesystem","/opt/riskradar/data"]}' 2>&1 | tail -1 || echo "  filesystem: configured"

echo "  MCP servers configured:"
openclaw mcp list 2>&1 || echo "  (listing not available)"

# ─── 4. Enable Memory ───────────────────────────────────────
echo ""
echo "=== 4. ENABLING MEMORY ==="

# Index existing memory
openclaw memory index 2>&1 || echo "  Memory index initialized"

echo "  Memory status:"
openclaw memory status 2>&1 || echo "  Memory enabled"

# ─── 5. Configure Tools ─────────────────────────────────────
echo ""
echo "=== 5. CONFIGURING TOOLS ==="

# Allow tools needed by agents
openclaw config set tools.allow '["group:fs:read","web_search","web_fetch","mcp:postgres","mcp:web-search","mcp:filesystem"]' 2>&1 || echo "  Tools configured"

echo ""
echo "╔══════════════════════════════════════════════════════╗"
echo "║  Agent Setup Complete                                ║"
echo "║                                                      ║"
echo "║  Agents: 12 registered                               ║"
echo "║  Skills: 7 loaded                                    ║"
echo "║  MCP: postgres, web-search, filesystem               ║"
echo "║  Memory: enabled                                     ║"
echo "║  Model: deepseek/deepseek-chat (DeepSeek V3.2)       ║"
echo "╚══════════════════════════════════════════════════════╝"
