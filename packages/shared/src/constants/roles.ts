export const SystemRoles = {
  ADMIN: 'admin',
  COMPLIANCE_OFFICER: 'compliance_officer',
  CISO: 'ciso',
  ANALYST: 'analyst',
  MANAGER: 'manager',
  AUDITOR: 'auditor',
  REGULATOR: 'regulator',
} as const;

export type SystemRole = (typeof SystemRoles)[keyof typeof SystemRoles];

export const Permissions = {
  // Alerts
  ALERTS_READ: 'alerts.read',
  ALERTS_WRITE: 'alerts.write',
  ALERTS_REVIEW: 'alerts.review',
  ALERTS_ESCALATE: 'alerts.escalate',

  // Cases
  CASES_READ: 'cases.read',
  CASES_WRITE: 'cases.write',
  CASES_ASSIGN: 'cases.assign',
  CASES_CLOSE: 'cases.close',

  // Evidence
  EVIDENCE_READ: 'evidence.read',
  EVIDENCE_READ_IDENTIFIED: 'evidence.read_identified',

  // Policies
  POLICIES_READ: 'policies.read',
  POLICIES_WRITE: 'policies.write',
  POLICIES_APPROVE: 'policies.approve',

  // Risk Scores
  RISK_SCORES_READ: 'risk_scores.read',
  RISK_SCORES_READ_IDENTIFIED: 'risk_scores.read_identified',

  // Signals
  SIGNALS_READ: 'signals.read',
  SIGNALS_INGEST: 'signals.ingest',

  // Integrations
  INTEGRATIONS_READ: 'integrations.read',
  INTEGRATIONS_WRITE: 'integrations.write',
  INTEGRATIONS_MANAGE: 'integrations.manage',

  // Audit Logs
  AUDIT_LOGS_READ: 'audit_logs.read',

  // Users & Roles
  USERS_READ: 'users.read',
  USERS_WRITE: 'users.write',
  ROLES_READ: 'roles.read',
  ROLES_WRITE: 'roles.write',

  // Tenant
  TENANT_READ: 'tenant.read',
  TENANT_WRITE: 'tenant.write',

  // Agents
  AGENTS_READ: 'agents.read',
  AGENTS_MANAGE: 'agents.manage',

  // SAR Drafts
  SAR_READ: 'sar.read',
  SAR_GENERATE: 'sar.generate',
  SAR_APPROVE: 'sar.approve',
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

export const RolePermissions: Record<SystemRole, readonly Permission[]> = {
  [SystemRoles.ADMIN]: Object.values(Permissions),
  [SystemRoles.COMPLIANCE_OFFICER]: [
    Permissions.ALERTS_READ,
    Permissions.ALERTS_WRITE,
    Permissions.ALERTS_REVIEW,
    Permissions.ALERTS_ESCALATE,
    Permissions.CASES_READ,
    Permissions.CASES_WRITE,
    Permissions.CASES_ASSIGN,
    Permissions.CASES_CLOSE,
    Permissions.EVIDENCE_READ,
    Permissions.EVIDENCE_READ_IDENTIFIED,
    Permissions.POLICIES_READ,
    Permissions.POLICIES_WRITE,
    Permissions.POLICIES_APPROVE,
    Permissions.RISK_SCORES_READ,
    Permissions.RISK_SCORES_READ_IDENTIFIED,
    Permissions.SIGNALS_READ,
    Permissions.INTEGRATIONS_READ,
    Permissions.AUDIT_LOGS_READ,
    Permissions.SAR_READ,
    Permissions.SAR_GENERATE,
    Permissions.SAR_APPROVE,
    Permissions.AGENTS_READ,
  ],
  [SystemRoles.CISO]: [
    Permissions.ALERTS_READ,
    Permissions.ALERTS_REVIEW,
    Permissions.ALERTS_ESCALATE,
    Permissions.CASES_READ,
    Permissions.CASES_WRITE,
    Permissions.CASES_ASSIGN,
    Permissions.EVIDENCE_READ,
    Permissions.EVIDENCE_READ_IDENTIFIED,
    Permissions.POLICIES_READ,
    Permissions.POLICIES_WRITE,
    Permissions.RISK_SCORES_READ,
    Permissions.RISK_SCORES_READ_IDENTIFIED,
    Permissions.SIGNALS_READ,
    Permissions.INTEGRATIONS_READ,
    Permissions.INTEGRATIONS_WRITE,
    Permissions.AUDIT_LOGS_READ,
    Permissions.AGENTS_READ,
    Permissions.AGENTS_MANAGE,
  ],
  [SystemRoles.ANALYST]: [
    Permissions.ALERTS_READ,
    Permissions.ALERTS_WRITE,
    Permissions.ALERTS_REVIEW,
    Permissions.CASES_READ,
    Permissions.CASES_WRITE,
    Permissions.EVIDENCE_READ,
    Permissions.RISK_SCORES_READ,
    Permissions.SIGNALS_READ,
    Permissions.INTEGRATIONS_READ,
    Permissions.AUDIT_LOGS_READ,
    Permissions.SAR_READ,
    Permissions.SAR_GENERATE,
  ],
  [SystemRoles.MANAGER]: [
    Permissions.ALERTS_READ,
    Permissions.ALERTS_REVIEW,
    Permissions.CASES_READ,
    Permissions.EVIDENCE_READ,
    Permissions.RISK_SCORES_READ,
    Permissions.SIGNALS_READ,
  ],
  [SystemRoles.AUDITOR]: [
    Permissions.ALERTS_READ,
    Permissions.CASES_READ,
    Permissions.EVIDENCE_READ,
    Permissions.POLICIES_READ,
    Permissions.RISK_SCORES_READ,
    Permissions.SIGNALS_READ,
    Permissions.INTEGRATIONS_READ,
    Permissions.AUDIT_LOGS_READ,
  ],
  [SystemRoles.REGULATOR]: [
    Permissions.ALERTS_READ,
    Permissions.CASES_READ,
    Permissions.EVIDENCE_READ,
    Permissions.POLICIES_READ,
    Permissions.AUDIT_LOGS_READ,
  ],
} as const;
