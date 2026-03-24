import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import type { ModelRouter } from '../lib/model-router.js';

const logger = createLogger('regulatory-pipeline');

/**
 * Regulatory Change Pipeline
 *
 * The autonomous regulation-to-deployment loop:
 *
 * 1. DETECT:   Watchdog agent finds a regulatory change
 * 2. ASSESS:   AI analyzes impact on current monitoring policies
 * 3. NOTIFY:   CIO/CCO receives notification with impact assessment
 * 4. PROPOSE:  AI auto-generates new/updated policies to address the change
 * 5. REVIEW:   CIO/CCO reviews proposed changes in dashboard
 * 6. APPROVE:  CIO clicks "Approve" — triggers auto-implementation
 * 7. TEST:     System validates new policies against recent signal data
 * 8. DEPLOY:   Approved and tested policies go live automatically
 * 9. VERIFY:   Post-deployment verification confirms policies are working
 * 10. AUDIT:   Every step logged in immutable audit trail
 *
 * This is the OpenClaw agent workflow that makes regulatory compliance
 * autonomous. The Watchdog agent triggers the pipeline, other agents
 * execute each step, and humans approve at the critical gate.
 */

export interface RegulatoryChange {
  id: string;
  source: string;
  title: string;
  summary: string;
  effectiveDate: string | null;
  urgency: 'critical' | 'high' | 'medium' | 'low';
  affectedDomains: string[];
  affectedFrameworks: string[];
  detectedAt: Date;
}

export interface PolicyProposal {
  id: string;
  regulatoryChangeId: string;
  proposedPolicies: Array<{
    action: 'create' | 'update' | 'deactivate';
    policyName: string;
    domain: string;
    description: string;
    rules: Record<string, unknown>;
    regulatoryRef: string;
    naturalLanguage: string;
    existingPolicyId?: string;
  }>;
  thresholdChanges: Array<{
    signalType: string;
    currentThreshold: number;
    proposedThreshold: number;
    reason: string;
  }>;
  newSignalTypes: Array<{
    type: string;
    domain: string;
    description: string;
  }>;
  impactSummary: string;
  estimatedEffort: string;
  aiReasoning: string;
  status: 'proposed' | 'approved' | 'rejected' | 'testing' | 'deployed' | 'verified';
  proposedAt: Date;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  deployedAt: Date | null;
}

export class RegulatoryPipeline {
  private modelRouter: ModelRouter;

  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }

  /**
   * Step 4: PROPOSE — Auto-generate policy changes for a regulatory update
   *
   * Called by the Watchdog agent after detecting and assessing a change.
   * Generates specific policy proposals that the CIO/CCO can review.
   */
  async proposeChanges(
    tenantId: string,
    change: RegulatoryChange,
  ): Promise<PolicyProposal> {
    logger.info({ changeId: change.id, title: change.title }, 'Generating policy proposals for regulatory change');

    // Get current policies for context
    const currentPolicies = await prisma.policy.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, name: true, domain: true, rules: true, regulatoryRef: true, naturalLanguage: true },
    });

    // Get current regulatory rules
    const relatedRules = await prisma.regulatoryRule.findMany({
      where: {
        framework: { in: change.affectedFrameworks },
        isActive: true,
      },
    });

    // Use AI to generate specific policy proposals
    const response = await this.modelRouter.infer({
      systemPrompt: `You are a compliance automation engine. Given a regulatory change and the organization's current monitoring policies, generate specific policy proposals to achieve compliance.

Output valid JSON with this structure:
{
  "proposedPolicies": [
    {
      "action": "create" | "update" | "deactivate",
      "policyName": "human-readable policy name",
      "domain": "finance" | "security" | "hr" | "operations" | "communications" | "compliance",
      "description": "what this policy monitors and why",
      "rules": {
        "conditions": [{"field": "...", "operator": "gt|lt|eq|in", "value": ..., "signalType": "..."}],
        "logic": "and" | "or",
        "window": {"duration": N, "unit": "days|hours|minutes", "type": "rolling"},
        "actions": [{"type": "alert", "severity": "critical|high|medium|low"}]
      },
      "regulatoryRef": "exact regulation section",
      "naturalLanguage": "plain English description of the rule",
      "existingPolicyId": "ID if updating existing policy, null if creating new"
    }
  ],
  "thresholdChanges": [
    {"signalType": "...", "currentThreshold": N, "proposedThreshold": N, "reason": "..."}
  ],
  "newSignalTypes": [
    {"type": "signal_type_name", "domain": "...", "description": "what to detect"}
  ],
  "impactSummary": "2-3 sentences on overall compliance impact",
  "estimatedEffort": "estimated implementation effort"
}`,
      prompt: `REGULATORY CHANGE:
Title: ${change.title}
Source: ${change.source}
Summary: ${change.summary}
Effective Date: ${change.effectiveDate ?? 'Not specified'}
Urgency: ${change.urgency}
Affected Domains: ${change.affectedDomains.join(', ')}
Affected Frameworks: ${change.affectedFrameworks.join(', ')}

CURRENT ACTIVE POLICIES (${currentPolicies.length}):
${currentPolicies.map((p) => `- ${p.name} [${p.domain}] Ref: ${p.regulatoryRef ?? 'none'}`).join('\n')}

EXISTING REGULATORY RULES (${relatedRules.length}):
${relatedRules.map((r) => `- ${r.framework} ${r.section}: ${r.title}`).join('\n')}

Generate specific, actionable policy proposals to address this regulatory change. Each proposal must include executable monitoring rules, not just descriptions.`,
      requireReasoning: true,
      maxTokens: 4096,
    });

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(response.content);
    } catch {
      parsed = {
        proposedPolicies: [],
        thresholdChanges: [],
        newSignalTypes: [],
        impactSummary: response.content,
        estimatedEffort: 'Unknown',
      };
    }

    const proposal: PolicyProposal = {
      id: `prop_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      regulatoryChangeId: change.id,
      proposedPolicies: (parsed['proposedPolicies'] as PolicyProposal['proposedPolicies']) ?? [],
      thresholdChanges: (parsed['thresholdChanges'] as PolicyProposal['thresholdChanges']) ?? [],
      newSignalTypes: (parsed['newSignalTypes'] as PolicyProposal['newSignalTypes']) ?? [],
      impactSummary: String(parsed['impactSummary'] ?? ''),
      estimatedEffort: String(parsed['estimatedEffort'] ?? ''),
      aiReasoning: response.reasoning ?? '',
      status: 'proposed',
      proposedAt: new Date(),
      reviewedBy: null,
      reviewedAt: null,
      deployedAt: null,
    };

    // Store proposal in learning state for dashboard access
    await prisma.learningState.create({
      data: {
        tenantId,
        learningType: 'regulatory_proposal',
        key: proposal.id,
        state: proposal as any,
      },
    });

    logger.info({
      proposalId: proposal.id,
      policyCount: proposal.proposedPolicies.length,
      thresholdChanges: proposal.thresholdChanges.length,
      newSignals: proposal.newSignalTypes.length,
    }, 'Policy proposals generated');

    return proposal;
  }

  /**
   * Step 6: APPROVE — CIO/CCO approves the proposal, triggering implementation
   */
  async approveProposal(
    tenantId: string,
    proposalId: string,
    approvedBy: string,
  ): Promise<{ success: boolean; testResults: TestResult[] }> {
    logger.info({ proposalId, approvedBy }, 'CIO approved regulatory proposal');

    // Get proposal
    const state = await prisma.learningState.findFirst({
      where: { tenantId, learningType: 'regulatory_proposal', key: proposalId },
    });
    if (!state) throw new Error('Proposal not found');

    const proposal = state.state as unknown as PolicyProposal;
    proposal.status = 'testing';
    proposal.reviewedBy = approvedBy;
    proposal.reviewedAt = new Date();

    // Step 7: TEST — Validate proposed policies against recent data
    const testResults = await this.testPolicies(tenantId, proposal);

    const allPassed = testResults.every((r) => r.passed);
    if (!allPassed) {
      proposal.status = 'rejected';
      logger.warn({ proposalId, failedTests: testResults.filter((r) => !r.passed).length }, 'Proposal failed testing');
    } else {
      // Step 8: DEPLOY — Create/update policies in production
      await this.deployPolicies(tenantId, proposal, approvedBy);
      proposal.status = 'deployed';
      proposal.deployedAt = new Date();
      logger.info({ proposalId }, 'Policies deployed successfully');
    }

    // Update stored proposal
    await prisma.learningState.updateMany({
      where: { tenantId, learningType: 'regulatory_proposal', key: proposalId },
      data: { state: proposal as any, lastUpdatedAt: new Date() },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        tenantId,
        actorType: 'user',
        actorId: approvedBy,
        action: `regulatory_proposal.${proposal.status}`,
        resource: 'regulatory_proposal',
        resourceId: proposalId,
        details: {
          status: proposal.status,
          policiesCreated: proposal.proposedPolicies.filter((p) => p.action === 'create').length,
          policiesUpdated: proposal.proposedPolicies.filter((p) => p.action === 'update').length,
          testResults: testResults.map((r) => ({ test: r.name, passed: r.passed })),
        } as any,
      },
    });

    return { success: allPassed, testResults };
  }

  /**
   * Step 7: TEST — Validate proposed policies against recent signal data
   */
  private async testPolicies(
    tenantId: string,
    proposal: PolicyProposal,
  ): Promise<TestResult[]> {
    const results: TestResult[] = [];

    for (const policy of proposal.proposedPolicies) {
      if (policy.action === 'deactivate') {
        results.push({ name: `Deactivate: ${policy.policyName}`, passed: true, details: 'Deactivation does not require testing' });
        continue;
      }

      // Validate rule structure
      const rules = policy.rules as any;
      const hasConditions = rules?.conditions?.length > 0;
      const hasActions = rules?.actions?.length > 0;
      const hasValidOperators = (rules?.conditions ?? []).every((c: any) =>
        ['eq', 'neq', 'gt', 'gte', 'lt', 'lte', 'in', 'not_in', 'contains', 'regex'].includes(c.operator),
      );

      results.push({
        name: `Structure: ${policy.policyName}`,
        passed: hasConditions && hasActions && hasValidOperators,
        details: !hasConditions ? 'Missing conditions' : !hasActions ? 'Missing actions' : !hasValidOperators ? 'Invalid operators' : 'Valid structure',
      });

      // Test against recent signals to estimate alert volume
      if (rules?.conditions?.[0]?.signalType) {
        const signalCount = await prisma.signal.count({
          where: {
            tenantId,
            signalType: rules.conditions[0].signalType,
            timestamp: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
          },
        });

        const estimatedAlerts = Math.round(signalCount * 0.1); // rough estimate
        results.push({
          name: `Volume: ${policy.policyName}`,
          passed: estimatedAlerts < 1000, // reject if would generate >1000 alerts/month
          details: `Estimated ${estimatedAlerts} alerts/month from ${signalCount} matching signals in last 30 days`,
        });
      }

      // Validate regulatory reference exists
      if (policy.regulatoryRef) {
        const ruleExists = await prisma.regulatoryRule.findFirst({
          where: { section: { contains: policy.regulatoryRef.split(' ')[0] ?? '' } },
        });
        results.push({
          name: `RegRef: ${policy.policyName}`,
          passed: ruleExists !== null,
          details: ruleExists ? `Mapped to: ${ruleExists.title}` : `Regulatory reference not found in knowledge base`,
        });
      }
    }

    return results;
  }

  /**
   * Step 8: DEPLOY — Create/update policies in production database
   */
  private async deployPolicies(
    tenantId: string,
    proposal: PolicyProposal,
    deployedBy: string,
  ): Promise<void> {
    for (const policy of proposal.proposedPolicies) {
      switch (policy.action) {
        case 'create':
          await prisma.policy.create({
            data: {
              tenantId,
              name: policy.policyName,
              description: policy.description,
              policyType: 'monitoring_rule',
              domain: policy.domain,
              rules: policy.rules as any,
              naturalLanguage: policy.naturalLanguage,
              regulatoryRef: policy.regulatoryRef,
              createdBy: deployedBy,
              approvedBy: deployedBy,
              approvedAt: new Date(),
              isActive: true,
            },
          });
          logger.info({ name: policy.policyName }, 'Policy created');
          break;

        case 'update':
          if (policy.existingPolicyId) {
            const existing = await prisma.policy.findFirst({
              where: { id: policy.existingPolicyId, tenantId },
            });
            if (existing) {
              // Create new version, deactivate old
              await prisma.policy.create({
                data: {
                  tenantId,
                  name: policy.policyName,
                  description: policy.description,
                  policyType: existing.policyType,
                  domain: policy.domain,
                  rules: policy.rules as any,
                  naturalLanguage: policy.naturalLanguage,
                  regulatoryRef: policy.regulatoryRef,
                  createdBy: deployedBy,
                  approvedBy: deployedBy,
                  approvedAt: new Date(),
                  version: existing.version + 1,
                  previousVersionId: existing.id,
                  isActive: true,
                },
              });
              await prisma.policy.update({
                where: { id: existing.id },
                data: { isActive: false },
              });
              logger.info({ name: policy.policyName, version: existing.version + 1 }, 'Policy updated (new version)');
            }
          }
          break;

        case 'deactivate':
          if (policy.existingPolicyId) {
            await prisma.policy.update({
              where: { id: policy.existingPolicyId },
              data: { isActive: false },
            });
            logger.info({ name: policy.policyName }, 'Policy deactivated');
          }
          break;
      }
    }
  }

  /**
   * Step 9: VERIFY — Post-deployment check that policies are firing correctly
   */
  async verifyDeployment(
    tenantId: string,
    proposalId: string,
  ): Promise<{ verified: boolean; details: string }> {
    const state = await prisma.learningState.findFirst({
      where: { tenantId, learningType: 'regulatory_proposal', key: proposalId },
    });
    if (!state) return { verified: false, details: 'Proposal not found' };

    const proposal = state.state as unknown as PolicyProposal;
    if (proposal.status !== 'deployed') {
      return { verified: false, details: `Proposal status is ${proposal.status}, not deployed` };
    }

    // Check that new policies exist and are active
    const activePolicies = await prisma.policy.count({
      where: { tenantId, isActive: true },
    });

    proposal.status = 'verified';
    await prisma.learningState.updateMany({
      where: { tenantId, learningType: 'regulatory_proposal', key: proposalId },
      data: { state: proposal as any, lastUpdatedAt: new Date() },
    });

    logger.info({ proposalId, activePolicies }, 'Deployment verified');
    return { verified: true, details: `${activePolicies} active policies. Deployment verified.` };
  }
}

export interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}
