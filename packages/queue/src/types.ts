import type { NormalizedSignalEvent } from '@riskradar/shared';

export const QueueNames = {
  SIGNAL_INGESTION: 'signal-ingestion',
  ALERT_PROCESSING: 'alert-processing',
  RISK_SCORE_CALCULATION: 'risk-score-calculation',
  NOTIFICATION: 'notification',
  INTEGRATION_SYNC: 'integration-sync',
  MODEL_INFERENCE: 'model-inference',
  EVIDENCE_COMPILATION: 'evidence-compilation',
  SAR_GENERATION: 'sar-generation',
  BIAS_CHECK: 'bias-check',
  AUTO_LEARNING: 'auto-learning',
} as const;

export type QueueName = (typeof QueueNames)[keyof typeof QueueNames];

export interface SignalIngestionJob {
  tenantId: string;
  signals: NormalizedSignalEvent[];
  batchId: string;
}

export interface AlertProcessingJob {
  tenantId: string;
  alertId: string;
  action: 'generate_evidence_brief' | 'calculate_compound_score' | 'check_regulatory_mapping';
}

export interface RiskScoreCalculationJob {
  tenantId: string;
  subjectType: string;
  subjectId: string;
  triggeredBy: 'signal' | 'schedule' | 'manual';
}

export interface NotificationJob {
  tenantId: string;
  channel: 'slack' | 'teams' | 'email' | 'sms' | 'webhook';
  recipientId?: string;
  recipientAddress?: string;
  templateId: string;
  payload: Record<string, unknown>;
}

export interface IntegrationSyncJob {
  tenantId: string;
  integrationId: string;
  syncType: 'full' | 'incremental';
}

export interface ModelInferenceJob {
  tenantId: string;
  tier: 'tier1_super' | 'tier2_cascade' | 'tier3_cloud';
  prompt: string;
  systemPrompt: string;
  context: Record<string, unknown>;
  callbackQueue: string;
  callbackJobId: string;
}

export interface AutoLearningJob {
  tenantId: string;
  learningType:
    | 'threshold_adjustment'
    | 'false_positive_analysis'
    | 'pattern_refinement'
    | 'digital_twin_update'
    | 'model_drift_check';
  payload: Record<string, unknown>;
}
