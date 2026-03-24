import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import type { ModelRouter } from '../lib/model-router.js';

const logger = createLogger('sar-generator');

/**
 * Automated SAR/STR Draft Generator
 *
 * When a suspicious activity pattern is confirmed by a human reviewer,
 * this engine auto-drafts a Suspicious Activity Report (SAR) following
 * FinCEN filing format (BSA E-Filing system).
 *
 * The BSA officer reviews, edits, and approves before submission.
 * All drafts are audit-logged.
 */
export class SARGenerator {
  private modelRouter: ModelRouter;

  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }

  async generateDraft(input: SARGenerationInput): Promise<SARDraft> {
    logger.info(
      { caseId: input.caseId, alertCount: input.alertIds.length },
      'Generating SAR draft',
    );

    // Gather all evidence and alert data
    const alerts = await prisma.alert.findMany({
      where: {
        id: { in: input.alertIds },
        tenantId: input.tenantId,
      },
    });

    const evidence = await prisma.evidence.findMany({
      where: {
        tenantId: input.tenantId,
        alertId: { in: input.alertIds },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Build context for AI generation
    const alertSummaries = alerts.map((a) => ({
      type: a.alertType,
      severity: a.severity,
      score: a.compoundScore,
      domains: a.domains,
      description: a.description,
      evidenceBrief: a.evidenceBrief,
    }));

    const evidenceSummary = evidence.map((e) => ({
      type: e.evidenceType,
      title: e.title,
      description: e.description,
      source: e.sourceSystem,
      timestamp: e.timestamp.toISOString(),
    }));

    // Generate narrative using Tier 2 (Cascade-2) for deep reasoning
    const response = await this.modelRouter.infer({
      systemPrompt: `You are a compliance report writer generating a Suspicious Activity Report (SAR) narrative for FinCEN filing. Follow the BSA E-Filing format.

Generate a JSON response with:
{
  "narrative": "The SAR narrative section (Part V). Write in formal regulatory language. Be specific about dates, amounts, transaction types, and patterns. Reference specific evidence by source and timestamp.",
  "subjectInfo": {
    "role": "subject's role/position",
    "department": "department",
    "employmentDuration": "how long employed"
  },
  "activityDescription": "Concise description of the suspicious activity",
  "timeline": [
    {"date": "ISO date", "event": "description of event", "source": "data source"}
  ],
  "evidenceCitations": [
    {"reference": "evidence title", "source": "system", "significance": "why it matters"}
  ],
  "regulatoryRefs": [
    {"regulation": "BSA/AML section", "relevance": "how it applies"}
  ],
  "filingRecommendation": "immediate|within_30_days|requires_further_investigation"
}`,
      prompt: `Case ID: ${input.caseId}
Subject ID: ${input.subjectId}

Alerts (${alerts.length}):
${JSON.stringify(alertSummaries, null, 2)}

Evidence (${evidence.length} items):
${JSON.stringify(evidenceSummary, null, 2)}

Additional context: ${input.additionalContext ?? 'None provided'}`,
      requireReasoning: true,
      maxTokens: 4096,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = {
        narrative: response.content,
        activityDescription: 'See narrative',
        timeline: [],
        evidenceCitations: [],
        regulatoryRefs: [],
      };
    }

    // Calculate filing deadline (30 calendar days from detection)
    const filingDeadline = new Date();
    filingDeadline.setDate(filingDeadline.getDate() + 30);

    // Store draft
    const draft = await prisma.sarDraft.create({
      data: {
        tenantId: input.tenantId,
        caseId: input.caseId,
        alertIds: input.alertIds,
        status: 'draft',
        narrative: String(parsed['narrative'] ?? ''),
        subjectInfo: (parsed['subjectInfo'] ?? {}) as any,
        activityDescription: String(parsed['activityDescription'] ?? ''),
        timeline: (parsed['timeline'] ?? []) as any,
        evidenceCitations: (parsed['evidenceCitations'] ?? []) as any,
        regulatoryRefs: (parsed['regulatoryRefs'] ?? []) as any,
        filingDeadline,
        generatedBy: input.generatedBy,
      },
    });

    logger.info(
      { sarDraftId: draft.id, caseId: input.caseId },
      'SAR draft generated',
    );

    return {
      id: draft.id,
      caseId: input.caseId,
      narrative: draft.narrative,
      subjectInfo: draft.subjectInfo as Record<string, unknown>,
      activityDescription: draft.activityDescription,
      timeline: draft.timeline as Record<string, unknown>[],
      evidenceCitations: draft.evidenceCitations as Record<string, unknown>[],
      regulatoryRefs: draft.regulatoryRefs as Record<string, unknown>[],
      filingDeadline,
      status: 'draft',
      aiReasoning: response.reasoning,
    };
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface SARGenerationInput {
  tenantId: string;
  caseId: string;
  alertIds: string[];
  subjectId: string;
  generatedBy: string;
  additionalContext?: string;
}

export interface SARDraft {
  id: string;
  caseId: string;
  narrative: string;
  subjectInfo: Record<string, unknown>;
  activityDescription: string;
  timeline: Record<string, unknown>[];
  evidenceCitations: Record<string, unknown>[];
  regulatoryRefs: Record<string, unknown>[];
  filingDeadline: Date;
  status: string;
  aiReasoning?: string;
}
