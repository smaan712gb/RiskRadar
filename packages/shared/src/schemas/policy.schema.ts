import { z } from 'zod';
import { riskDomainSchema } from './alert.schema.js';

export const policyTypeSchema = z.enum([
  'monitoring_rule',
  'alert_threshold',
  'escalation_workflow',
  'data_retention',
  'consent',
  'anonymization',
  'agent_sandbox',
]);

const conditionOperatorSchema = z.enum([
  'eq',
  'neq',
  'gt',
  'gte',
  'lt',
  'lte',
  'in',
  'not_in',
  'contains',
  'regex',
]);

const policyConditionSchema = z.object({
  field: z.string(),
  operator: conditionOperatorSchema,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.string()), z.array(z.number())]),
  domain: riskDomainSchema.optional(),
  signalType: z.string().optional(),
});

const policyWindowSchema = z.object({
  duration: z.number().int().min(1),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks']),
  type: z.enum(['rolling', 'fixed']),
});

const policyActionSchema = z.object({
  type: z.enum(['alert', 'escalate', 'notify', 'restrict_access', 'log']),
  severity: z.string().optional(),
  target: z.string().optional(),
  channel: z.string().optional(),
  message: z.string().optional(),
});

const policyRulesSchema = z.object({
  conditions: z.array(policyConditionSchema).min(1),
  logic: z.enum(['and', 'or']),
  window: policyWindowSchema.optional(),
  actions: z.array(policyActionSchema).min(1),
});

export const createPolicySchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10).max(5000),
  policyType: policyTypeSchema,
  domain: riskDomainSchema,
  rules: policyRulesSchema,
  naturalLanguage: z.string().max(2000).optional(),
  regulatoryRef: z.string().max(500).optional(),
});

export const naturalLanguagePolicySchema = z.object({
  description: z.string().min(10).max(2000),
  domain: riskDomainSchema.optional(),
});

export type CreatePolicySchema = z.infer<typeof createPolicySchema>;
export type NaturalLanguagePolicySchema = z.infer<typeof naturalLanguagePolicySchema>;
