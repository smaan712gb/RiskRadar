export interface Integration {
  id: string;
  tenantId: string;
  name: string;
  integrationType: IntegrationType;
  provider: IntegrationProvider;
  config: IntegrationConfig;
  status: IntegrationStatus;
  lastSyncAt: Date | null;
  lastSyncStatus: string | null;
  syncSchedule: string | null;
  healthCheckUrl: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export type IntegrationType =
  | 'hris'
  | 'erp_finance'
  | 'siem_security'
  | 'iam'
  | 'communication'
  | 'crm'
  | 'operations'
  | 'custom';

export type IntegrationProvider =
  | 'workday'
  | 'successfactors'
  | 'adp'
  | 'bamboohr'
  | 'sap'
  | 'oracle'
  | 'netsuite'
  | 'splunk'
  | 'qradar'
  | 'sentinel'
  | 'crowdstrike'
  | 'azure_ad'
  | 'okta'
  | 'cyberark'
  | 'microsoft365'
  | 'slack'
  | 'google_workspace'
  | 'salesforce'
  | 'zendesk'
  | 'servicenow'
  | 'jira'
  | 'github'
  | 'gitlab'
  | 'pagerduty'
  | 'custom';

export type IntegrationStatus = 'active' | 'inactive' | 'error' | 'syncing';

export interface IntegrationConfig {
  baseUrl: string;
  authType: 'api_key' | 'oauth2' | 'basic' | 'bearer' | 'certificate';
  endpoints: Record<string, string>;
  pollIntervalMinutes?: number;
  batchSize?: number;
  customHeaders?: Record<string, string>;
}

export interface CreateIntegrationInput {
  name: string;
  integrationType: IntegrationType;
  provider: IntegrationProvider;
  config: IntegrationConfig;
  credentials: Record<string, string>;
  syncSchedule?: string;
  healthCheckUrl?: string;
}
