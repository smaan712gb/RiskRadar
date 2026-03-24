export interface Evidence {
  id: string;
  tenantId: string;
  alertId: string | null;
  caseId: string | null;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  sourceSystem: string;
  sourceId: string | null;
  dataSnapshot: Record<string, unknown>;
  timestamp: Date;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export type EvidenceType =
  | 'transaction'
  | 'access_log'
  | 'behavioral'
  | 'communication_metadata'
  | 'system_event'
  | 'document'
  | 'screenshot'
  | 'agent_log';

export interface CreateEvidenceInput {
  alertId?: string;
  caseId?: string;
  evidenceType: EvidenceType;
  title: string;
  description: string;
  sourceSystem: string;
  sourceId?: string;
  dataSnapshot: Record<string, unknown>;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
