-- ─── RiskRadar Post-Migration Setup ─────────────────────────
-- Run this AFTER prisma migrate deploy on fresh installs.
-- This sets up TimescaleDB hypertables, continuous aggregates,
-- retention policies, and audit log immutability.

-- ─── TimescaleDB Setup ──────────────────────────────────────
-- Convert signals table to hypertable for time-series performance
SELECT create_hypertable('signals', 'timestamp', if_not_exists => TRUE);

-- Continuous aggregate: hourly signal counts per domain
-- (enables fast dashboard queries without scanning raw signals)
CREATE MATERIALIZED VIEW IF NOT EXISTS signal_hourly_counts
WITH (timescaledb.continuous) AS
SELECT
  tenant_id AS "tenantId",
  domain,
  signal_type AS "signalType",
  subject_id AS "subjectId",
  time_bucket('1 hour', timestamp) AS bucket,
  COUNT(*) AS signal_count,
  AVG(value) AS avg_value,
  MAX(value) AS max_value,
  MIN(value) AS min_value
FROM signals
GROUP BY "tenantId", domain, "signalType", "subjectId", bucket;

-- Continuous aggregate: daily risk score summary
CREATE MATERIALIZED VIEW IF NOT EXISTS risk_score_daily
WITH (timescaledb.continuous) AS
SELECT
  tenant_id AS "tenantId",
  subject_id AS "subjectId",
  subject_type AS "subjectType",
  time_bucket('1 day', calculated_at) AS bucket,
  AVG(overall_score) AS avg_score,
  MAX(overall_score) AS max_score,
  MIN(overall_score) AS min_score,
  COUNT(*) AS score_count
FROM risk_scores
GROUP BY "tenantId", "subjectId", "subjectType", bucket;

-- ─── Retention Policies ─────────────────────────────────────
-- Auto-drop raw signals older than configured retention period
-- Default: 1 year for raw signals
SELECT add_retention_policy('signals', INTERVAL '1 year', if_not_exists => TRUE);

-- ─── Compression Policies ───────────────────────────────────
-- Compress signal data older than 7 days (saves ~90% storage)
ALTER TABLE signals SET (
  timescaledb.compress,
  timescaledb.compress_segmentby = 'tenant_id, domain, signal_type'
);
SELECT add_compression_policy('signals', INTERVAL '7 days', if_not_exists => TRUE);

-- ─── Audit Log Immutability ─────────────────────────────────
-- Prevent UPDATE and DELETE on audit_logs table
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted on the audit_logs table.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop if exists (idempotent)
DROP TRIGGER IF EXISTS audit_logs_immutable_update ON audit_logs;
DROP TRIGGER IF EXISTS audit_logs_immutable_delete ON audit_logs;

CREATE TRIGGER audit_logs_immutable_update
  BEFORE UPDATE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

CREATE TRIGGER audit_logs_immutable_delete
  BEFORE DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION prevent_audit_log_modification();

-- ─── Performance Indexes ────────────────────────────────────
-- Additional indexes for common query patterns not covered by Prisma

-- Compound index for alert queue view (most common query)
CREATE INDEX IF NOT EXISTS idx_alerts_queue ON alerts (tenant_id, status, severity, created_at DESC);

-- Compound index for risk score leaderboard
CREATE INDEX IF NOT EXISTS idx_risk_scores_leaderboard ON risk_scores (tenant_id, overall_score DESC, calculated_at DESC);

-- Alert feedback for auto-learning queries
CREATE INDEX IF NOT EXISTS idx_alert_feedback_learning ON alert_feedback (tenant_id, alert_type, outcome, feedback_at DESC);

-- ─── Row-Level Security (Optional) ─────────────────────────
-- Enable RLS for additional tenant isolation at the database level.
-- Uncomment these if deploying in multi-tenant shared database mode.

-- ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_alerts ON alerts
--   USING (tenant_id = current_setting('app.tenant_id')::text);

-- ALTER TABLE cases ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_cases ON cases
--   USING (tenant_id = current_setting('app.tenant_id')::text);

-- ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY tenant_isolation_signals ON signals
--   USING (tenant_id = current_setting('app.tenant_id')::text);
