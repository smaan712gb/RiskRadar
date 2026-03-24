#!/bin/bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────
# RiskRadar Pilot Customer Demo Data Generator
# Creates realistic demo data for pilot demonstrations
#
# Usage: ./pilot-demo.sh [API_URL] [TENANT_SLUG]
# ─────────────────────────────────────────────────────────────

API_URL="${1:-http://localhost:3001/api/v1}"
TENANT_SLUG="${2:-demo-bank}"

echo "=== RiskRadar Pilot Demo Data Generator ==="
echo "API: $API_URL"
echo "Tenant: $TENANT_SLUG"
echo ""

# ─── Login ───────────────────────────────────────────────────
echo "[1/6] Authenticating..."
LOGIN_RESPONSE=$(curl -sf "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"tenantSlug\":\"$TENANT_SLUG\",\"email\":\"admin@riskradar.dev\",\"password\":\"admin123!\"}")

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)
if [ -z "$TOKEN" ]; then
  echo "  Failed to authenticate. Is the API running?"
  exit 1
fi
echo "  Authenticated successfully."

AUTH="Authorization: Bearer $TOKEN"

# ─── Ingest Demo Signals ────────────────────────────────────
echo "[2/6] Ingesting demo signals (finance)..."
curl -sf "$API_URL/signals/ingest" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {"domain":"finance","signalType":"override_transaction","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"core_banking","value":52000,"metadata":{"txId":"TX-7821","overrideType":"wire_transfer","supervisorPresent":false}},
      {"domain":"finance","signalType":"override_transaction","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"core_banking","value":48500,"metadata":{"txId":"TX-7822","overrideType":"wire_transfer","supervisorPresent":false}},
      {"domain":"finance","signalType":"override_transaction","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"core_banking","value":67000,"metadata":{"txId":"TX-7825","overrideType":"wire_transfer","supervisorPresent":false}},
      {"domain":"finance","signalType":"new_payee","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"core_banking","value":0,"metadata":{"payeeId":"PAY-1104","createdDate":"2026-03-15"}},
      {"domain":"finance","signalType":"expense_anomaly","subjectType":"employee","subjectId":"EMP-2156","sourceSystem":"erp","value":1500,"metadata":{"expenseId":"EXP-891","category":"travel","submittedOnWeekend":true}}
    ]
  }' > /dev/null
echo "  5 finance signals ingested."

echo "[3/6] Ingesting demo signals (security)..."
curl -sf "$API_URL/signals/ingest" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {"domain":"security","signalType":"after_hours_access","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"azure_ad","metadata":{"resource":"client_database","timestamp":"2026-03-14T23:47:00Z","ip":"10.0.1.42"}},
      {"domain":"security","signalType":"after_hours_access","subjectType":"employee","subjectId":"EMP-9012","sourceSystem":"azure_ad","metadata":{"resource":"engineering_repo","timestamp":"2026-03-13T02:15:00Z"}},
      {"domain":"security","signalType":"data_exfiltration","subjectType":"employee","subjectId":"EMP-9012","sourceSystem":"dlp","value":2300,"metadata":{"destination":"personal_gdrive","filetype":"zip","sizeMb":2300}},
      {"domain":"security","signalType":"failed_login_spike","subjectType":"system","subjectId":"SVC-API-03","sourceSystem":"splunk","value":47,"metadata":{"window":"5min","sourceIPs":["10.0.2.15","10.0.2.16"]}}
    ]
  }' > /dev/null
echo "  4 security signals ingested."

echo "[4/6] Ingesting demo signals (hr + comms)..."
curl -sf "$API_URL/signals/ingest" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "signals": [
      {"domain":"hr","signalType":"training_missed","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"workday","metadata":{"trainingType":"AML Refresher","dueDate":"2026-03-01"}},
      {"domain":"hr","signalType":"attendance_anomaly","subjectType":"employee","subjectId":"EMP-3291","sourceSystem":"workday","value":4,"metadata":{"sickDaysThisMonth":4,"pattern":"monday_friday"}},
      {"domain":"hr","signalType":"performance_decline","subjectType":"employee","subjectId":"EMP-3847","sourceSystem":"workday","value":1.5,"metadata":{"currentRating":2.5,"previousRating":4.0}},
      {"domain":"communications","signalType":"communication_drop","subjectType":"employee","subjectId":"EMP-4821","sourceSystem":"slack","value":5,"metadata":{"previousDailyMessages":25,"currentDailyMessages":5}},
      {"domain":"communications","signalType":"response_time_increase","subjectType":"employee","subjectId":"EMP-3847","sourceSystem":"microsoft365","value":180,"metadata":{"avgResponseMinutes":180,"previousAvg":30}},
      {"domain":"operations","signalType":"productivity_decline","subjectType":"employee","subjectId":"EMP-3847","sourceSystem":"jira","value":-35,"metadata":{"sprintVelocityChange":-35,"overdueTickets":8}}
    ]
  }' > /dev/null
echo "  6 hr/comms/ops signals ingested."

# ─── Create Demo Policies ───────────────────────────────────
echo "[5/6] Creating demo policies..."
curl -sf "$API_URL/policies" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "name":"Transaction Override Monitoring",
    "description":"Alert when any employee processes more than 3 override transactions in a 7-day window, especially during supervisor absence",
    "policyType":"monitoring_rule",
    "domain":"finance",
    "rules":{"conditions":[{"field":"override_count","operator":"gt","value":3,"signalType":"override_transaction"}],"logic":"and","window":{"duration":7,"unit":"days","type":"rolling"},"actions":[{"type":"alert","severity":"high"}]},
    "regulatoryRef":"BSA/AML 31 CFR 1020.320"
  }' > /dev/null

curl -sf "$API_URL/policies" \
  -H "$AUTH" -H "Content-Type: application/json" \
  -d '{
    "name":"After-Hours Data Access Detection",
    "description":"Alert when any employee accesses sensitive systems between 9PM and 6AM",
    "policyType":"monitoring_rule",
    "domain":"security",
    "rules":{"conditions":[{"field":"access_hour","operator":"lt","value":6},{"field":"access_hour","operator":"gt","value":21}],"logic":"or","actions":[{"type":"alert","severity":"medium"}]},
    "regulatoryRef":"NIST CSF PR.AC-1"
  }' > /dev/null

echo "  2 policies created."

# ─── Summary ─────────────────────────────────────────────────
echo "[6/6] Demo data ready!"
echo ""
echo "=== Demo Scenario ==="
echo ""
echo "EMP-4821 (Finance Dept) — HIGH RISK COMPOUND PATTERN:"
echo "  - 3 override wire transfers ($52K, $48.5K, $67K) without supervisor"
echo "  - After-hours data access (11:47 PM)"
echo "  - New payee created same day as transfers"
echo "  - Missed mandatory AML training"
echo "  - Slack activity dropped 80%"
echo ""
echo "EMP-9012 (Engineering) — DATA EXFILTRATION ALERT:"
echo "  - After-hours access to engineering repo (2:15 AM)"
echo "  - 2.3GB data transfer to personal Google Drive"
echo ""
echo "EMP-3847 (Sales) — ATTRITION RISK / BURNOUT:"
echo "  - Performance rating dropped from 4.0 to 2.5"
echo "  - Email response time increased 6x (30min → 180min)"
echo "  - Sprint velocity down 35%, 8 overdue tickets"
echo ""
echo "Dashboard: http://localhost:3000"
echo "API Docs: $API_URL/../docs"
