import { z } from 'zod';
import { riskDomainSchema, subjectTypeSchema } from './alert.schema.js';

export const signalIngestionSchema = z.object({
  domain: riskDomainSchema,
  signalType: z.string().min(1).max(100),
  subjectType: subjectTypeSchema,
  subjectId: z.string().min(1),
  sourceSystem: z.string().min(1).max(100),
  value: z.number().optional(),
  metadata: z.record(z.unknown()),
  timestamp: z.string().datetime().optional(),
});

export const signalBatchIngestionSchema = z.object({
  signals: z.array(signalIngestionSchema).min(1).max(1000),
});

export const signalQuerySchema = z.object({
  domain: riskDomainSchema.optional(),
  signalType: z.string().optional(),
  subjectId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(10000).default(100),
});

export type SignalIngestionSchema = z.infer<typeof signalIngestionSchema>;
export type SignalBatchIngestionSchema = z.infer<typeof signalBatchIngestionSchema>;
export type SignalQuerySchema = z.infer<typeof signalQuerySchema>;
