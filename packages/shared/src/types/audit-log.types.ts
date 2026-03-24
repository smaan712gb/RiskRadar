export interface AuditLog {
  id: string;
  tenantId: string;
  actorType: ActorType;
  actorId: string;
  action: string;
  resource: string;
  resourceId: string;
  details: AuditDetails;
  ipAddress: string | null;
  userAgent: string | null;
  timestamp: Date;
}

export type ActorType = 'user' | 'system' | 'agent';

export interface AuditDetails {
  before?: Record<string, unknown>;
  after?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface AuditLogQueryParams {
  actorId?: string;
  actorType?: ActorType;
  action?: string;
  resource?: string;
  resourceId?: string;
  from?: string;
  to?: string;
}

export type AuditAction =
  | 'alert.created'
  | 'alert.status_changed'
  | 'alert.assigned'
  | 'alert.escalated'
  | 'alert.dismissed'
  | 'case.created'
  | 'case.status_changed'
  | 'case.assigned'
  | 'case.comment_added'
  | 'case.resolved'
  | 'policy.created'
  | 'policy.updated'
  | 'policy.approved'
  | 'policy.deactivated'
  | 'integration.created'
  | 'integration.updated'
  | 'integration.synced'
  | 'integration.error'
  | 'user.created'
  | 'user.updated'
  | 'user.deactivated'
  | 'user.login'
  | 'user.logout'
  | 'agent.started'
  | 'agent.stopped'
  | 'agent.error'
  | 'agent.signal_ingested'
  | 'agent.reasoning_completed'
  | 'sar.drafted'
  | 'sar.approved'
  | 'tenant.settings_updated';
