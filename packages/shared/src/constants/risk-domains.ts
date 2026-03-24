export const RiskDomain = {
  HR: 'hr',
  FINANCE: 'finance',
  SECURITY: 'security',
  OPERATIONS: 'operations',
  COMMUNICATIONS: 'communications',
  COMPLIANCE: 'compliance',
  CUSTOMER: 'customer',
} as const;

export type RiskDomainType = (typeof RiskDomain)[keyof typeof RiskDomain];

export const RiskDomainLabels: Record<RiskDomainType, string> = {
  [RiskDomain.HR]: 'Human Resources & Workforce',
  [RiskDomain.FINANCE]: 'Financial & Transaction',
  [RiskDomain.SECURITY]: 'Security & Infrastructure',
  [RiskDomain.OPERATIONS]: 'Operations & Productivity',
  [RiskDomain.COMMUNICATIONS]: 'Communications & Collaboration',
  [RiskDomain.COMPLIANCE]: 'Compliance & Regulatory',
  [RiskDomain.CUSTOMER]: 'Customer & CRM',
};

export const SignalTypes = {
  // HR signals
  TRAINING_MISSED: 'training_missed',
  ATTENDANCE_ANOMALY: 'attendance_anomaly',
  PERFORMANCE_DECLINE: 'performance_decline',
  LEAVE_PATTERN_CHANGE: 'leave_pattern_change',
  ROLE_CHANGE: 'role_change',

  // Finance signals
  OVERRIDE_TRANSACTION: 'override_transaction',
  UNUSUAL_AMOUNT: 'unusual_amount',
  EXPENSE_ANOMALY: 'expense_anomaly',
  BUDGET_OVERRUN: 'budget_overrun',
  APPROVAL_BYPASS: 'approval_bypass',
  NEW_PAYEE: 'new_payee',

  // Security signals
  AFTER_HOURS_ACCESS: 'after_hours_access',
  FAILED_LOGIN_SPIKE: 'failed_login_spike',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  DATA_EXFILTRATION: 'data_exfiltration',
  UNUSUAL_DATA_ACCESS: 'unusual_data_access',
  MFA_BYPASS: 'mfa_bypass',

  // Operations signals
  PRODUCTIVITY_DECLINE: 'productivity_decline',
  TOOL_USAGE_CHANGE: 'tool_usage_change',
  TASK_COMPLETION_DROP: 'task_completion_drop',
  SYSTEM_ANOMALY: 'system_anomaly',

  // Communications signals
  COMMUNICATION_DROP: 'communication_drop',
  SENTIMENT_SHIFT: 'sentiment_shift',
  MEETING_PATTERN_CHANGE: 'meeting_pattern_change',
  RESPONSE_TIME_INCREASE: 'response_time_increase',
  EXTERNAL_COMM_SPIKE: 'external_comm_spike',

  // Compliance signals
  POLICY_VIOLATION: 'policy_violation',
  AUDIT_FINDING: 'audit_finding',
  REGULATORY_BREACH: 'regulatory_breach',
  CONSENT_WITHDRAWAL: 'consent_withdrawal',

  // Customer signals
  CUSTOMER_COMPLAINT_SPIKE: 'customer_complaint_spike',
  CHURN_INDICATOR: 'churn_indicator',
  SLA_BREACH: 'sla_breach',
} as const;

export type SignalType = (typeof SignalTypes)[keyof typeof SignalTypes];

export const SignalToDomain: Record<SignalType, RiskDomainType> = {
  [SignalTypes.TRAINING_MISSED]: RiskDomain.HR,
  [SignalTypes.ATTENDANCE_ANOMALY]: RiskDomain.HR,
  [SignalTypes.PERFORMANCE_DECLINE]: RiskDomain.HR,
  [SignalTypes.LEAVE_PATTERN_CHANGE]: RiskDomain.HR,
  [SignalTypes.ROLE_CHANGE]: RiskDomain.HR,
  [SignalTypes.OVERRIDE_TRANSACTION]: RiskDomain.FINANCE,
  [SignalTypes.UNUSUAL_AMOUNT]: RiskDomain.FINANCE,
  [SignalTypes.EXPENSE_ANOMALY]: RiskDomain.FINANCE,
  [SignalTypes.BUDGET_OVERRUN]: RiskDomain.FINANCE,
  [SignalTypes.APPROVAL_BYPASS]: RiskDomain.FINANCE,
  [SignalTypes.NEW_PAYEE]: RiskDomain.FINANCE,
  [SignalTypes.AFTER_HOURS_ACCESS]: RiskDomain.SECURITY,
  [SignalTypes.FAILED_LOGIN_SPIKE]: RiskDomain.SECURITY,
  [SignalTypes.PRIVILEGE_ESCALATION]: RiskDomain.SECURITY,
  [SignalTypes.DATA_EXFILTRATION]: RiskDomain.SECURITY,
  [SignalTypes.UNUSUAL_DATA_ACCESS]: RiskDomain.SECURITY,
  [SignalTypes.MFA_BYPASS]: RiskDomain.SECURITY,
  [SignalTypes.PRODUCTIVITY_DECLINE]: RiskDomain.OPERATIONS,
  [SignalTypes.TOOL_USAGE_CHANGE]: RiskDomain.OPERATIONS,
  [SignalTypes.TASK_COMPLETION_DROP]: RiskDomain.OPERATIONS,
  [SignalTypes.SYSTEM_ANOMALY]: RiskDomain.OPERATIONS,
  [SignalTypes.COMMUNICATION_DROP]: RiskDomain.COMMUNICATIONS,
  [SignalTypes.SENTIMENT_SHIFT]: RiskDomain.COMMUNICATIONS,
  [SignalTypes.MEETING_PATTERN_CHANGE]: RiskDomain.COMMUNICATIONS,
  [SignalTypes.RESPONSE_TIME_INCREASE]: RiskDomain.COMMUNICATIONS,
  [SignalTypes.EXTERNAL_COMM_SPIKE]: RiskDomain.COMMUNICATIONS,
  [SignalTypes.POLICY_VIOLATION]: RiskDomain.COMPLIANCE,
  [SignalTypes.AUDIT_FINDING]: RiskDomain.COMPLIANCE,
  [SignalTypes.REGULATORY_BREACH]: RiskDomain.COMPLIANCE,
  [SignalTypes.CONSENT_WITHDRAWAL]: RiskDomain.COMPLIANCE,
  [SignalTypes.CUSTOMER_COMPLAINT_SPIKE]: RiskDomain.CUSTOMER,
  [SignalTypes.CHURN_INDICATOR]: RiskDomain.CUSTOMER,
  [SignalTypes.SLA_BREACH]: RiskDomain.CUSTOMER,
};
