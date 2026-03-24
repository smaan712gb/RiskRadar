export const AlertStatus = {
  NEW: 'new',
  UNDER_REVIEW: 'under_review',
  CONFIRMED: 'confirmed',
  DISMISSED: 'dismissed',
  ESCALATED: 'escalated',
  RESOLVED: 'resolved',
} as const;

export type AlertStatusType = (typeof AlertStatus)[keyof typeof AlertStatus];

export const AlertStatusTransitions: Record<AlertStatusType, readonly AlertStatusType[]> = {
  [AlertStatus.NEW]: [AlertStatus.UNDER_REVIEW, AlertStatus.DISMISSED],
  [AlertStatus.UNDER_REVIEW]: [
    AlertStatus.CONFIRMED,
    AlertStatus.DISMISSED,
    AlertStatus.ESCALATED,
  ],
  [AlertStatus.CONFIRMED]: [AlertStatus.ESCALATED, AlertStatus.RESOLVED],
  [AlertStatus.DISMISSED]: [AlertStatus.UNDER_REVIEW],
  [AlertStatus.ESCALATED]: [AlertStatus.RESOLVED],
  [AlertStatus.RESOLVED]: [],
};

export function isValidTransition(from: AlertStatusType, to: AlertStatusType): boolean {
  return AlertStatusTransitions[from].includes(to);
}
