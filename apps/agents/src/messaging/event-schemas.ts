import type { NormalizedSignalEvent, RiskDomainType } from '@riskradar/shared';

export interface AgentMessage {
  fromAgentId: string;
  toAgentId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

// ─── Collection → Analysis Messages ────────────────────────

export interface SignalBatchMessage extends AgentMessage {
  type: 'signal_batch';
  payload: {
    domain: RiskDomainType;
    signals: NormalizedSignalEvent[];
    batchId: string;
  };
}

export interface AnomalyDetectedMessage extends AgentMessage {
  type: 'anomaly_detected';
  payload: {
    domain: RiskDomainType;
    signalType: string;
    subjectId: string;
    anomalyScore: number;
    context: Record<string, unknown>;
  };
}

// ─── Analysis → Response Messages ──────────────────────────

export interface CompoundRiskMessage extends AgentMessage {
  type: 'compound_risk_detected';
  payload: {
    subjectId: string;
    domains: RiskDomainType[];
    compoundScore: number;
    signalIds: string[];
    evidenceChain: Array<{
      sequence: number;
      timestamp: string;
      description: string;
      sourceSystem: string;
      signalType: string;
    }>;
    requiresDeepReasoning: boolean;
  };
}

export interface EvidenceBriefReadyMessage extends AgentMessage {
  type: 'evidence_brief_ready';
  payload: {
    alertId: string;
    evidenceBrief: Record<string, unknown>;
    regulatoryMapping: Array<Record<string, unknown>>;
  };
}

export interface TrajectoryAlertMessage extends AgentMessage {
  type: 'trajectory_alert';
  payload: {
    subjectId: string;
    currentScore: number;
    projectedScore: number;
    trajectory: 'accelerating' | 'stable' | 'declining';
    projectedBreachDate: string | null;
    trendData: Array<{ date: string; score: number }>;
  };
}

// ─── Auto-Learning Messages ────────────────────────────────

export interface FeedbackReceivedMessage extends AgentMessage {
  type: 'feedback_received';
  payload: {
    alertId: string;
    outcome: 'confirmed' | 'dismissed';
    alertType: string;
    domains: string[];
    compoundScore: number;
    feedbackNotes: string | null;
  };
}

export interface ThresholdAdjustmentMessage extends AgentMessage {
  type: 'threshold_adjustment';
  payload: {
    domain: RiskDomainType;
    signalType: string;
    previousThreshold: number;
    newThreshold: number;
    reason: string;
    confidence: number;
  };
}

export interface DigitalTwinUpdateMessage extends AgentMessage {
  type: 'digital_twin_update';
  payload: {
    roleArchetype: string;
    department: string | null;
    baselineData: Record<string, unknown>;
    sampleSize: number;
  };
}
