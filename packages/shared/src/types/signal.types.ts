import type { RiskDomainType, SignalType } from '../constants/risk-domains.js';
import type { SubjectType } from './alert.types.js';

export interface Signal {
  id: string;
  tenantId: string;
  domain: RiskDomainType;
  signalType: SignalType;
  subjectType: SubjectType;
  subjectId: string;
  sourceSystem: string;
  value: number | null;
  metadata: Record<string, unknown>;
  normalizedAt: Date | null;
  timestamp: Date;
}

export interface SignalIngestionInput {
  domain: RiskDomainType;
  signalType: SignalType;
  subjectType: SubjectType;
  subjectId: string;
  sourceSystem: string;
  value?: number;
  metadata: Record<string, unknown>;
  timestamp?: string;
}

export interface SignalBatchIngestionInput {
  signals: SignalIngestionInput[];
}

export interface SignalQueryParams {
  domain?: RiskDomainType;
  signalType?: SignalType;
  subjectId?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export interface SignalStats {
  domain: RiskDomainType;
  signalType: string;
  count: number;
  avgValue: number | null;
  maxValue: number | null;
  bucket: string;
}

export interface NormalizedSignalEvent {
  signalId: string;
  tenantId: string;
  domain: RiskDomainType;
  signalType: SignalType;
  subjectType: SubjectType;
  subjectId: string;
  sourceSystem: string;
  value: number | null;
  metadata: Record<string, unknown>;
  timestamp: Date;
  correlationId?: string;
}
