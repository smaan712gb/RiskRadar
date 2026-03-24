import type { AlertSeverityType } from '../constants/alert-severity';
import type { AlertStatusType } from '../constants/alert-status';
import type { RiskDomainType } from '../constants/risk-domains';

export interface Alert {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  alertType: AlertType;
  severity: AlertSeverityType;
  status: AlertStatusType;
  compoundScore: number;
  confidenceScore: number;
  falsePositiveLikelihood: FalsePositiveLikelihood;
  domains: RiskDomainType[];
  subjectType: SubjectType;
  subjectId: string;
  assignedTo: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  dismissReason: string | null;
  caseId: string | null;
  evidenceBrief: EvidenceBrief | null;
  regulatoryMapping: RegulatoryMapping[];
  modelVersion: string;
  reasoningModelUsed: ReasoningTier;
  processingTimeMs: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvidenceBrief {
  summary: string;
  evidenceChain: EvidenceChainItem[];
  reasoning: string;
  regulatoryMapping: RegulatoryMapping[];
  recommendedActions: RecommendedAction[];
  confidenceScore: number;
  falsePositiveLikelihood: FalsePositiveLikelihood;
}

export interface EvidenceChainItem {
  sequence: number;
  timestamp: string;
  description: string;
  sourceSystem: string;
  sourceId: string;
  signalType: string;
  rawData?: Record<string, unknown>;
}

export interface RegulatoryMapping {
  regulation: string;
  section: string;
  description: string;
  relevance: 'direct' | 'related' | 'contextual';
}

export interface RecommendedAction {
  priority: 'immediate' | 'within_24h' | 'within_72h' | 'within_week';
  action: string;
  assignTo?: string;
}

export type AlertType =
  | 'compound_risk'
  | 'single_signal'
  | 'trajectory_breach'
  | 'policy_violation'
  | 'behavioral_anomaly'
  | 'financial_anomaly'
  | 'security_event'
  | 'compliance_gap';

export type SubjectType = 'employee' | 'department' | 'system' | 'vendor' | 'account';

export type FalsePositiveLikelihood = 'very_low' | 'low' | 'medium' | 'high';

export type ReasoningTier = 'tier1_super' | 'tier2_cascade' | 'tier3_cloud';

export interface CreateAlertInput {
  title: string;
  description: string;
  alertType: AlertType;
  severity: AlertSeverityType;
  compoundScore: number;
  confidenceScore: number;
  falsePositiveLikelihood: FalsePositiveLikelihood;
  domains: RiskDomainType[];
  subjectType: SubjectType;
  subjectId: string;
  evidenceBrief: EvidenceBrief | null;
  regulatoryMapping: RegulatoryMapping[];
  modelVersion: string;
  reasoningModelUsed: ReasoningTier;
  processingTimeMs: number;
  signalIds: string[];
}

export interface UpdateAlertStatusInput {
  status: AlertStatusType;
  reviewNotes?: string;
  dismissReason?: string;
}
