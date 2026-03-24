import type { RiskDomainType } from '../constants/risk-domains.js';
import type { SubjectType } from './alert.types.js';

export interface RiskScore {
  id: string;
  tenantId: string;
  subjectType: SubjectType;
  subjectId: string;
  overallScore: number;
  domainScores: DomainScores;
  trajectory: RiskTrajectory;
  trendData: TrendDataPoint[];
  modelVersion: string;
  calculatedAt: Date;
}

export type DomainScores = Partial<Record<RiskDomainType, number>>;

export type RiskTrajectory = 'accelerating' | 'stable' | 'declining' | 'new';

export interface TrendDataPoint {
  date: string;
  score: number;
  domainScores?: DomainScores;
}

export interface RiskScoreHistory {
  subjectId: string;
  subjectType: SubjectType;
  currentScore: number;
  trajectory: RiskTrajectory;
  trendData: TrendDataPoint[];
  projectedScore?: number;
  projectedBreachDate?: string;
  interventionRecommended: boolean;
}

export interface RiskScoreCalculationInput {
  tenantId: string;
  subjectType: SubjectType;
  subjectId: string;
  signals: Array<{
    domain: RiskDomainType;
    signalType: string;
    value: number | null;
    timestamp: Date;
  }>;
  previousScores?: TrendDataPoint[];
}
