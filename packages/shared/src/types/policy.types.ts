import type { RiskDomainType } from '../constants/risk-domains';

export interface Policy {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  policyType: PolicyType;
  domain: RiskDomainType;
  rules: PolicyRules;
  naturalLanguage: string | null;
  isActive: boolean;
  version: number;
  previousVersionId: string | null;
  regulatoryRef: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type PolicyType =
  | 'monitoring_rule'
  | 'alert_threshold'
  | 'escalation_workflow'
  | 'data_retention'
  | 'consent'
  | 'anonymization'
  | 'agent_sandbox';

export interface PolicyRules {
  conditions: PolicyCondition[];
  logic: 'and' | 'or';
  window?: PolicyWindow;
  actions: PolicyAction[];
}

export interface PolicyCondition {
  field: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'regex';
  value: string | number | boolean | string[] | number[];
  domain?: RiskDomainType;
  signalType?: string;
}

export interface PolicyWindow {
  duration: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks';
  type: 'rolling' | 'fixed';
}

export interface PolicyAction {
  type: 'alert' | 'escalate' | 'notify' | 'restrict_access' | 'log';
  severity?: string;
  target?: string;
  channel?: string;
  message?: string;
}

export interface CreatePolicyInput {
  name: string;
  description: string;
  policyType: PolicyType;
  domain: RiskDomainType;
  rules: PolicyRules;
  naturalLanguage?: string;
  regulatoryRef?: string;
}

export interface NaturalLanguagePolicyInput {
  description: string;
  domain?: RiskDomainType;
}

export interface ParsedPolicyResult {
  name: string;
  description: string;
  policyType: PolicyType;
  domain: RiskDomainType;
  rules: PolicyRules;
  dataSources: string[];
  confidence: number;
  warnings: string[];
}
