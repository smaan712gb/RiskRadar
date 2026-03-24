export const CaseStatus = {
  OPEN: 'open',
  INVESTIGATING: 'investigating',
  PENDING_REVIEW: 'pending_review',
  PENDING_LEGAL: 'pending_legal',
  ACTION_REQUIRED: 'action_required',
  CLOSED_CONFIRMED: 'closed_confirmed',
  CLOSED_FALSE_POSITIVE: 'closed_false_positive',
  CLOSED_NO_ACTION: 'closed_no_action',
} as const;

export type CaseStatusType = (typeof CaseStatus)[keyof typeof CaseStatus];

export const CasePriority = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
} as const;

export type CasePriorityType = (typeof CasePriority)[keyof typeof CasePriority];

export const CaseSLAHours: Record<CasePriorityType, number> = {
  [CasePriority.CRITICAL]: 2,
  [CasePriority.HIGH]: 8,
  [CasePriority.MEDIUM]: 24,
  [CasePriority.LOW]: 72,
};
