import type { CasePriorityType, CaseStatusType } from '../constants/case-status';
import type { SubjectType } from './alert.types';

export interface Case {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  status: CaseStatusType;
  priority: CasePriorityType;
  subjectType: SubjectType;
  subjectId: string;
  assignedTo: string | null;
  createdBy: string;
  slaDeadline: Date | null;
  resolvedAt: Date | null;
  resolution: string | null;
  alertIds: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CaseComment {
  id: string;
  caseId: string;
  authorId: string;
  content: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface CreateCaseInput {
  title: string;
  description: string;
  priority: CasePriorityType;
  subjectType: SubjectType;
  subjectId: string;
  alertIds: string[];
  tags?: string[];
}

export interface UpdateCaseInput {
  title?: string;
  description?: string;
  status?: CaseStatusType;
  priority?: CasePriorityType;
  assignedTo?: string | null;
  resolution?: string;
  tags?: string[];
}
