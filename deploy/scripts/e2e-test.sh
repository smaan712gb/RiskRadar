#!/bin/bash
# RisksRadarAI — Comprehensive E2E Test Suite
# Tests every API endpoint, page, and workflow against the live system

API="${1:-https://risksradarai.com/api/v1}"
SITE="${2:-https://risksradarai.com}"
PASS=0; FAIL=0; TOTAL=0

t() {
  TOTAL=$((TOTAL + 1))
  if echo "$3" | grep -q "$2"; then
    PASS=$((PASS + 1)); echo "  [PASS] $1"
  else
    FAIL=$((FAIL + 1)); echo "  [FAIL] $1 (expected: $2, got: ${3:0:80})"
  fi
}

echo "=============================================="
echo "  RisksRadarAI E2E Test Suite"
echo "  API: $API"
echo "  Site: $SITE"
echo "=============================================="
echo ""

echo "--- 1. HEALTH ---"
t "API health" "ok" "$(curl -sf $API/health)"
t "API version" "0.1.0" "$(curl -sf $API/health)"

echo ""
echo "--- 2. AUTH ---"
LOGIN=$(curl -sf -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo-bank","email":"smaan2011@gmail.com","password":"GG7124me$"}')
t "Login valid creds" "success" "$LOGIN"
TOKEN=$(echo "$LOGIN" | sed 's/.*"accessToken":"\([^"]*\)".*/\1/')
t "JWT returned" "eyJ" "$TOKEN"

BAD=$(curl -sf -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo-bank","email":"smaan2011@gmail.com","password":"wrong"}')
t "Bad password rejected" "Invalid" "$BAD"

BAD2=$(curl -sf -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"tenantSlug":"fake-tenant","email":"x@x.com","password":"x"}')
t "Bad tenant rejected" "Invalid" "$BAD2"

LOGIN2=$(curl -sf -X POST $API/auth/login -H "Content-Type: application/json" \
  -d '{"tenantSlug":"demo-bank","email":"smaan@aimadds.com","password":"GG7124me$"}')
t "Second admin login" "success" "$LOGIN2"

AUTH="Authorization: Bearer $TOKEN"

echo ""
echo "--- 3. REGISTRATION ---"
SLUG="e2e-$(date +%s)"
REG=$(curl -sf -X POST $API/auth/register -H "Content-Type: application/json" \
  -d "{\"tenantName\":\"E2E Test $SLUG\",\"tenantSlug\":\"$SLUG\",\"industry\":\"banking\",\"name\":\"Tester\",\"email\":\"$SLUG@test.com\",\"password\":\"TestPass123\"}")
t "Register new tenant" "success" "$REG"
t "Registration returns JWT" "accessToken" "$REG"
t "Registration returns tenant" "tenant" "$REG"

echo ""
echo "--- 4. SIGNAL INGESTION ---"
ING=$(curl -sf -X POST $API/signals/ingest -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"signals":[{"domain":"finance","signalType":"override_transaction","subjectType":"employee","subjectId":"EMP-E2E","sourceSystem":"test","value":50000,"metadata":{"test":true}},{"domain":"security","signalType":"after_hours_access","subjectType":"employee","subjectId":"EMP-E2E","sourceSystem":"test","metadata":{"test":true}},{"domain":"hr","signalType":"training_missed","subjectType":"employee","subjectId":"EMP-E2E","sourceSystem":"test","metadata":{"test":true}}]}')
t "Ingest 3 signals" "success" "$ING"
t "Batch ID present" "batchId" "$ING"

EMPTY=$(curl -sf -X POST $API/signals/ingest -H "$AUTH" -H "Content-Type: application/json" -d '{"signals":[]}')
t "Empty batch rejected" "validation" "$(echo "$EMPTY" | tr '[:upper:]' '[:lower:]')"

NOAUTH_CODE=$(curl -sf -o /dev/null -w "%{http_code}" -X POST $API/signals/ingest -H "Content-Type: application/json" -d '{"signals":[{"domain":"finance","signalType":"x","subjectType":"employee","subjectId":"x","sourceSystem":"x","metadata":{}}]}')
t "Ingest without auth = 401" "401" "$NOAUTH_CODE"

echo ""
echo "--- 5. SIGNALS QUERY ---"
t "Query signals" "success" "$(curl -sf "$API/signals?page=1&pageSize=5" -H "$AUTH")"
t "Signal stats" "success" "$(curl -sf "$API/signals/stats" -H "$AUTH")"
t "Signals filtered by domain" "success" "$(curl -sf "$API/signals?domain=finance" -H "$AUTH")"

echo ""
echo "--- 6. ALERTS ---"
t "List alerts" "success" "$(curl -sf "$API/alerts" -H "$AUTH")"
t "Alerts pagination" "pagination" "$(curl -sf "$API/alerts?page=1&pageSize=5" -H "$AUTH")"
t "Filter by severity" "success" "$(curl -sf "$API/alerts?severity=critical" -H "$AUTH")"
t "Filter by status" "success" "$(curl -sf "$API/alerts?status=new" -H "$AUTH")"

ALERT_404=$(curl -sf -o /dev/null -w "%{http_code}" "$API/alerts/fake-id" -H "$AUTH")
t "Non-existent alert = 404" "404" "$ALERT_404"

BAD_STATUS=$(curl -sf -X PATCH "$API/alerts/fake-id/status" -H "$AUTH" -H "Content-Type: application/json" -d '{"status":"invalid_status"}')
t "Invalid alert status rejected" "validation" "$(echo "$BAD_STATUS" | tr '[:upper:]' '[:lower:]')"

echo ""
echo "--- 7. CASES ---"
t "List cases" "success" "$(curl -sf "$API/cases" -H "$AUTH")"

CASE=$(curl -sf -X POST $API/cases -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"title":"E2E Test Case","description":"Automated test case for compound risk","priority":"high","subjectType":"employee","subjectId":"EMP-E2E","alertIds":["dummy"],"tags":["e2e"]}')
t "Create case" "success" "$CASE"
CID=$(echo "$CASE" | sed 's/.*"id":"\([^"]*\)".*/\1/')
t "Case ID returned" "c" "$CID"

if [ -n "$CID" ] && [ "$CID" != "$CASE" ]; then
  t "Get case detail" "success" "$(curl -sf "$API/cases/$CID" -H "$AUTH")"
  t "Case title correct" "E2E Test" "$(curl -sf "$API/cases/$CID" -H "$AUTH")"
  t "Case status open" "open" "$(curl -sf "$API/cases/$CID" -H "$AUTH")"

  COMMENT=$(curl -sf -X POST "$API/cases/$CID/comments" -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"content":"E2E test investigation note","isInternal":true}')
  t "Add case comment" "success" "$COMMENT"

  UPDATE=$(curl -sf -X PATCH "$API/cases/$CID" -H "$AUTH" -H "Content-Type: application/json" \
    -d '{"status":"investigating"}')
  t "Update case status" "success" "$UPDATE"
fi

echo ""
echo "--- 8. POLICIES ---"
t "List policies" "success" "$(curl -sf "$API/policies" -H "$AUTH")"

POL=$(curl -sf -X POST $API/policies -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"name":"E2E Override Policy","description":"Test policy for override monitoring","policyType":"monitoring_rule","domain":"finance","rules":{"conditions":[{"field":"count","operator":"gt","value":3}],"logic":"and","actions":[{"type":"alert","severity":"high"}]},"regulatoryRef":"BSA/AML"}')
t "Create policy" "success" "$POL"
PID=$(echo "$POL" | sed 's/.*"id":"\([^"]*\)".*/\1/')

if [ -n "$PID" ] && [ "$PID" != "$POL" ]; then
  t "Get policy detail" "success" "$(curl -sf "$API/policies/$PID" -H "$AUTH")"
  t "Policy has reg ref" "BSA" "$(curl -sf "$API/policies/$PID" -H "$AUTH")"
fi

BAD_POL=$(curl -sf -X POST $API/policies -H "$AUTH" -H "Content-Type: application/json" \
  -d '{"description":"no name","policyType":"monitoring_rule","domain":"finance","rules":{"conditions":[{"field":"x","operator":"gt","value":1}],"logic":"and","actions":[{"type":"alert"}]}}')
t "Policy without name rejected" "validation" "$(echo "$BAD_POL" | tr '[:upper:]' '[:lower:]')"

echo ""
echo "--- 9. RISK SCORES ---"
t "List risk scores" "success" "$(curl -sf "$API/risk-scores" -H "$AUTH")"
t "Risk heatmap" "success" "$(curl -sf "$API/risk-scores/heatmap" -H "$AUTH")"

echo ""
echo "--- 10. AUDIT LOGS ---"
t "List audit logs" "success" "$(curl -sf "$API/audit-logs" -H "$AUTH")"
t "Audit with date range" "success" "$(curl -sf "$API/audit-logs?from=2026-01-01T00:00:00Z&to=2026-12-31T23:59:59Z" -H "$AUTH")"

echo ""
echo "--- 11. INTEGRATIONS ---"
t "List integrations" "success" "$(curl -sf "$API/integrations" -H "$AUTH")"

echo ""
echo "--- 12. USERS ---"
t "List users" "success" "$(curl -sf "$API/users" -H "$AUTH")"

echo ""
echo "--- 13. BILLING ---"
t "Get current plan" "success" "$(curl -sf "$API/billing/plan" -H "$AUTH")"

echo ""
echo "--- 14. SECURITY ---"
t "No auth on alerts" "401" "$(curl -sf -o /dev/null -w '%{http_code}' $API/alerts)"
t "Invalid JWT rejected" "401" "$(curl -sf -o /dev/null -w '%{http_code}' $API/alerts -H 'Authorization: Bearer fake.jwt.token')"
t "SQL injection blocked" "Invalid" "$(curl -sf -X POST $API/auth/login -H 'Content-Type: application/json' -d '{"tenantSlug":"x","email":"x; DROP TABLE users;--","password":"x"}')"

echo ""
echo "--- 15. DASHBOARD PAGES ---"
for p in "" pricing login signup about contact security privacy terms overview alerts cases risk-scores signals policies agents audit-log settings onboarding; do
  t "Page /$p" "200" "$(curl -sf -o /dev/null -w '%{http_code}' -L $SITE/$p)"
done

echo ""
echo "--- 16. SEO ---"
t "robots.txt" "200" "$(curl -sf -o /dev/null -w '%{http_code}' $SITE/robots.txt)"
t "sitemap.xml" "200" "$(curl -sf -o /dev/null -w '%{http_code}' $SITE/sitemap.xml)"
t "sitemap has URLs" "risksradarai.com" "$(curl -sf $SITE/sitemap.xml)"

echo ""
echo "=============================================="
echo "  RESULTS"
echo "  Total:  $TOTAL"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
RATE=$((PASS * 100 / TOTAL))
echo "  Rate:   $RATE%"
echo "=============================================="

if [ $FAIL -gt 0 ]; then exit 1; fi
