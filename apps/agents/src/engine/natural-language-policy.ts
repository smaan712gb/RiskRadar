import { createLogger } from '@riskradar/logger';
import type { PolicyRules, RiskDomainType } from '@riskradar/shared';
import type { ModelRouter } from '../lib/model-router.js';

const logger = createLogger('nl-policy');

/**
 * Natural Language Policy Builder
 *
 * Allows compliance officers to define monitoring policies in plain English.
 * The AI translates natural language descriptions into structured monitoring rules.
 *
 * Example:
 *   Input:  "Alert when any employee in the finance department processes more than
 *            3 override transactions in a week while their direct supervisor is on leave"
 *
 *   Output: Structured PolicyRules with conditions, window, and actions
 */
export class NaturalLanguagePolicyBuilder {
  private modelRouter: ModelRouter;

  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }

  async parsePolicy(description: string, suggestedDomain?: RiskDomainType): Promise<ParsedPolicy> {
    logger.info({ descriptionLength: description.length }, 'Parsing natural language policy');

    const response = await this.modelRouter.infer({
      systemPrompt: `You are a policy translation engine for an enterprise risk monitoring system. Convert natural language policy descriptions into structured monitoring rules.

Available signal types: override_transaction, unusual_amount, expense_anomaly, budget_overrun, approval_bypass, new_payee, after_hours_access, failed_login_spike, privilege_escalation, data_exfiltration, unusual_data_access, mfa_bypass, training_missed, attendance_anomaly, performance_decline, leave_pattern_change, productivity_decline, communication_drop, sentiment_shift, meeting_pattern_change, policy_violation, audit_finding, regulatory_breach, customer_complaint_spike, churn_indicator, sla_breach

Available domains: hr, finance, security, operations, communications, compliance, customer

Available operators: eq, neq, gt, gte, lt, lte, in, not_in, contains, regex

Output valid JSON matching this schema:
{
  "name": "short policy name",
  "description": "human-readable description",
  "policyType": "monitoring_rule",
  "domain": "one of the available domains",
  "rules": {
    "conditions": [
      {"field": "signal field", "operator": "comparison", "value": "threshold", "signalType": "signal type"}
    ],
    "logic": "and" or "or",
    "window": {"duration": number, "unit": "minutes|hours|days|weeks", "type": "rolling"},
    "actions": [
      {"type": "alert", "severity": "low|medium|high|critical"}
    ]
  },
  "dataSources": ["list of required data source systems"],
  "confidence": 0.0-1.0,
  "warnings": ["any caveats or ambiguities"]
}`,
      prompt: `${suggestedDomain ? `Suggested domain: ${suggestedDomain}\n\n` : ''}Policy description: "${description}"`,
      requireReasoning: true,
      maxTokens: 2048,
    });

    try {
      const parsed = JSON.parse(response.content);

      const result: ParsedPolicy = {
        name: parsed.name ?? 'Untitled Policy',
        description: parsed.description ?? description,
        policyType: parsed.policyType ?? 'monitoring_rule',
        domain: parsed.domain ?? suggestedDomain ?? 'compliance',
        rules: parsed.rules ?? { conditions: [], logic: 'and', actions: [] },
        dataSources: parsed.dataSources ?? [],
        confidence: parsed.confidence ?? 0.5,
        warnings: parsed.warnings ?? [],
        naturalLanguageInput: description,
        aiReasoning: response.reasoning,
      };

      logger.info(
        {
          name: result.name,
          domain: result.domain,
          conditionCount: result.rules.conditions?.length ?? 0,
          confidence: result.confidence,
        },
        'Policy parsed successfully',
      );

      return result;
    } catch (error) {
      logger.error({ error }, 'Failed to parse AI policy response');
      throw new Error(`Failed to parse policy from natural language: ${String(error)}`);
    }
  }

  /**
   * Validate a parsed policy against available data sources.
   * Returns warnings if required data sources are not connected.
   */
  async validatePolicy(
    tenantId: string,
    parsed: ParsedPolicy,
  ): Promise<PolicyValidation> {
    const warnings: string[] = [...parsed.warnings];
    const errors: string[] = [];

    // Check if rules have conditions
    if (!parsed.rules.conditions || parsed.rules.conditions.length === 0) {
      errors.push('Policy has no conditions defined');
    }

    // Check if actions are defined
    if (!parsed.rules.actions || parsed.rules.actions.length === 0) {
      errors.push('Policy has no actions defined');
    }

    // Low confidence warning
    if (parsed.confidence < 0.6) {
      warnings.push(
        `AI confidence is ${(parsed.confidence * 100).toFixed(0)}%. Review the generated rules carefully.`,
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      requiredDataSources: parsed.dataSources,
    };
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface ParsedPolicy {
  name: string;
  description: string;
  policyType: string;
  domain: RiskDomainType;
  rules: PolicyRules;
  dataSources: string[];
  confidence: number;
  warnings: string[];
  naturalLanguageInput: string;
  aiReasoning?: string;
}

export interface PolicyValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  requiredDataSources: string[];
}
