import { z } from 'zod';
import { subjectTypeSchema } from './alert.schema.js';

export const casePrioritySchema = z.enum(['critical', 'high', 'medium', 'low']);
export const caseStatusSchema = z.enum([
  'open',
  'investigating',
  'pending_review',
  'pending_legal',
  'action_required',
  'closed_confirmed',
  'closed_false_positive',
  'closed_no_action',
]);

export const createCaseSchema = z.object({
  title: z.string().min(5).max(500),
  description: z.string().min(10).max(10000),
  priority: casePrioritySchema,
  subjectType: subjectTypeSchema,
  subjectId: z.string(),
  alertIds: z.array(z.string()).min(1),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const updateCaseSchema = z.object({
  title: z.string().min(5).max(500).optional(),
  description: z.string().min(10).max(10000).optional(),
  status: caseStatusSchema.optional(),
  priority: casePrioritySchema.optional(),
  assignedTo: z.string().nullable().optional(),
  resolution: z.string().max(10000).optional(),
  tags: z.array(z.string().max(50)).max(20).optional(),
});

export const caseCommentSchema = z.object({
  content: z.string().min(1).max(10000),
  isInternal: z.boolean().default(true),
});

export type CreateCaseSchema = z.infer<typeof createCaseSchema>;
export type UpdateCaseSchema = z.infer<typeof updateCaseSchema>;
export type CaseCommentSchema = z.infer<typeof caseCommentSchema>;
