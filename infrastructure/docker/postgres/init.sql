-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Enable pgcrypto for UUID generation
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- After Prisma migration creates the signals table, run:
-- SELECT create_hypertable('signals', 'timestamp', if_not_exists => TRUE);

-- Prevent UPDATE and DELETE on audit_logs (immutability)
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- This trigger will be created after Prisma migration runs:
-- CREATE TRIGGER audit_logs_immutable
--   BEFORE UPDATE OR DELETE ON audit_logs
--   FOR EACH ROW
--   EXECUTE FUNCTION prevent_audit_log_modification();
