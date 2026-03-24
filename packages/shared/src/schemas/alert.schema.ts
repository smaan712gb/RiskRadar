import { z } from 'zod';

export const alertSeveritySchema = z.enum(['critical', 'high', 'medium', 'low', 'info']);
export const alertStatusSchema = z.enum([
  'new',
  'under_review',
  'confirmed',
  'dismissed',
  'escalated',
  'resolved',
]);
export const alertTypeSchema = z.enum([
  'compound_risk',
  'single_signal',
  'trajectory_breach',
  'policy_violation',
  'behavioral_anomaly',
  'financial_anomaly',
  'security_event',
  'compliance_gap',
]);
export const subjectTypeSchema = z.enum([
  'employee',
  'department',
  'system',
  'vendor',
  'account',
]);
export const falsePositiveLikelihoodSchema = z.enum(['very_low', 'low', 'medium', 'high']);
export const reasoningTierSchema = z.enum(['tier1_super', 'tier2_cascade', 'tier3_cloud']);
export const riskDomainSchema = z.enum([
  'hr',
  'finance',
  'security',
  'operations',
  'communications',
  'compliance',
  'customer',
]);

const regulatoryMappingSchema = z.object({
  regulation: z.string(),
  section: z.string(),
  description: z.string(),
  relevance: z.enum(['direct', 'related', 'contextual']),
});

const recommendedActionSchema = z.object({
  priority: z.enum(['immediate', 'within_24h', 'within_72h', 'within_week']),
  action: z.string(),
  assignTo: z.string().optional(),
});

const evidenceChainItemSchema = z.object({
  sequence: z.number().int(),
  timestamp: z.string(),
  description: z.string(),
  sourceSystem: z.string(),
  sourceId: z.string(),
  signalType: z.string(),
  rawData: z.record(z.unknown()).optional(),
});

export const evidenceBriefSchema = z.object({
  summary: z.string(),
  evidenceChain: z.array(evidenceChainItemSchema),
  reasoning: z.string(),
  regulatoryMapping: z.array(regulatoryMappingSchema),
  recommendedActions: z.array(recommendedActionSchema),
  confidenceScore: z.number().min(0).max(100),
  falsePositiveLikelihood: falsePositiveLikelihoodSchema,
});

export const createAlertSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().min(10).max(5000),
  alertType: alertTypeSchema,
  severity: alertSeveritySchema,
  compoundScore: z.number().min(0).max(100),
  confidenceScore: z.number().min(0).max(100),
  falsePositiveLikelihood: falsePositiveLikelihoodSchema,
  domains: z.array(riskDomainSchema).min(1),
  subjectType: subjectTypeSchema,
  subjectId: z.string(),
  evidenceBrief: evidenceBriefSchema.nullable(),
  regulatoryMapping: z.array(regulatoryMappingSchema),
  modelVersion: z.string(),
  reasoningModelUsed: reasoningTierSchema,
  processingTimeMs: z.number().int().min(0),
  signalIds: z.array(z.string()),
});

export const updateAlertStatusSchema = z.object({
  status: alertStatusSchema,
  reviewNotes: z.string().max(5000).optional(),
  dismissReason: z.string().max(2000).optional(),
});

export const alertQuerySchema = z.object({
  status: alertStatusSchema.optional(),
  severity: alertSeveritySchema.optional(),
  alertType: alertTypeSchema.optional(),
  domain: riskDomainSchema.optional(),
  subjectId: z.string().optional(),
  assignedTo: z.string().optional(),
});

export type CreateAlertSchema = z.infer<typeof createAlertSchema>;
export type UpdateAlertStatusSchema = z.infer<typeof updateAlertStatusSchema>;
export type AlertQuerySchema = z.infer<typeof alertQuerySchema>;
