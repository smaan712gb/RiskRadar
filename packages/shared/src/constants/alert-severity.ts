export const AlertSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info',
} as const;

export type AlertSeverityType = (typeof AlertSeverity)[keyof typeof AlertSeverity];

export const AlertSeverityOrder: Record<AlertSeverityType, number> = {
  [AlertSeverity.CRITICAL]: 5,
  [AlertSeverity.HIGH]: 4,
  [AlertSeverity.MEDIUM]: 3,
  [AlertSeverity.LOW]: 2,
  [AlertSeverity.INFO]: 1,
};

export const SeverityEscalationTargets: Record<AlertSeverityType, string[]> = {
  [AlertSeverity.CRITICAL]: ['ciso', 'compliance_officer', 'admin'],
  [AlertSeverity.HIGH]: ['compliance_officer', 'manager'],
  [AlertSeverity.MEDIUM]: ['analyst', 'manager'],
  [AlertSeverity.LOW]: ['analyst'],
  [AlertSeverity.INFO]: [],
};
