export interface Tenant {
  id: string;
  name: string;
  slug: string;
  industry: Industry;
  settings: TenantSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type Industry =
  | 'banking'
  | 'credit_union'
  | 'insurance'
  | 'healthcare'
  | 'manufacturing'
  | 'technology'
  | 'retail'
  | 'government'
  | 'education'
  | 'other';

export interface TenantSettings {
  timezone: string;
  dataRetentionDays: number;
  anonymizationLevel: 'full' | 'partial' | 'none';
  consentRequired: boolean;
  enabledDomains: string[];
  alertThresholds: {
    compoundScoreHigh: number;
    compoundScoreMedium: number;
    compoundScoreLow: number;
  };
  notifications: {
    slackEnabled: boolean;
    teamsEnabled: boolean;
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
  regulatoryFrameworks: string[];
}

export interface CreateTenantInput {
  name: string;
  slug: string;
  industry: Industry;
  settings?: Partial<TenantSettings>;
}

export const defaultTenantSettings: TenantSettings = {
  timezone: 'UTC',
  dataRetentionDays: 365,
  anonymizationLevel: 'partial',
  consentRequired: true,
  enabledDomains: ['hr', 'finance', 'security', 'operations', 'communications'],
  alertThresholds: {
    compoundScoreHigh: 75,
    compoundScoreMedium: 50,
    compoundScoreLow: 25,
  },
  notifications: {
    slackEnabled: false,
    teamsEnabled: false,
    emailEnabled: true,
    smsEnabled: false,
  },
  regulatoryFrameworks: [],
};
