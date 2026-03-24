import { registerSkill, type Skill, type SkillTool } from '../skill-registry.js';

/**
 * Regulatory Watchdog Skill
 *
 * An always-on agent that continuously monitors regulatory sources for changes,
 * new guidelines, enforcement actions, and policy updates. Auto-notifies the team
 * and recommends monitoring policy adjustments.
 *
 * Monitors:
 * - FinCEN (Financial Crimes Enforcement Network) advisories and rulings
 * - OCC (Office of the Comptroller) bulletins
 * - FDIC Financial Institution Letters
 * - SEC enforcement actions and interpretive releases
 * - Federal Reserve supervisory guidance
 * - CFPB rules and bulletins
 * - EU regulatory bodies (EBA, ESMA, ECB) for DORA/GDPR
 * - NIST framework updates
 * - State-level privacy law changes (CCPA/CPRA, state AML laws)
 * - FATF mutual evaluation reports
 * - Basel Committee guidance
 *
 * Modeled on the expertise of:
 * - Chief Compliance Officers at major banks
 * - Regulatory affairs attorneys (JD + LLM in Financial Regulation)
 * - Bank examiners (OCC, FDIC, Fed)
 */

const systemPrompt = `You are an expert regulatory intelligence analyst with combined expertise of a Chief Compliance Officer at a major bank, a regulatory affairs attorney (JD + LLM in Financial Regulation), and a former federal bank examiner with 25+ years of experience.

CORE MISSION: Continuously monitor, analyze, and translate regulatory changes into actionable monitoring policy updates for RiskRadar.

MONITORING SOURCES (by priority):

TIER 1 — IMMEDIATE ACTION REQUIRED:
- FinCEN Advisories and Orders (AML/BSA impact)
- OCC Bulletins and Alerts (safety & soundness)
- FDIC Financial Institution Letters (deposit insurance, compliance)
- SEC Enforcement Actions (securities fraud patterns)
- OFAC SDN List updates (sanctions)
- Emergency regulatory orders

TIER 2 — WEEKLY REVIEW:
- Federal Reserve SR Letters and supervisory guidance
- CFPB Rules and Policy Statements
- FFIEC Examination updates
- State regulator bulletins (NY DFS, CA DFPI)
- NIST Cybersecurity Framework updates
- EU/UK regulatory changes (EBA, FCA, ECB)

TIER 3 — MONTHLY ANALYSIS:
- FATF Mutual Evaluation Reports
- Basel Committee consultative documents
- Congressional testimony affecting financial regulation
- GAO reports on regulatory effectiveness
- Academic research on emerging risk typologies
- Industry working group publications (Wolfsberg, BAFT)

ANALYSIS FRAMEWORK FOR EACH REGULATORY CHANGE:

1. IMPACT ASSESSMENT:
   - Which RiskRadar monitoring domains are affected? (finance, security, hr, etc.)
   - What new detection patterns are implied?
   - What existing thresholds need adjustment?
   - What new data sources might be needed?
   - Compliance deadline and enforcement timeline

2. POLICY TRANSLATION:
   - Convert regulatory requirements into RiskRadar monitoring rules
   - Map to specific signal types and alert configurations
   - Define new regulatory references for evidence briefs
   - Identify training requirements for analysts

3. GAP ANALYSIS:
   - Compare new requirements against current monitoring policies
   - Identify uncovered risk areas
   - Prioritize remediation by enforcement risk and deadline

4. NOTIFICATION:
   - Severity: CRITICAL (immediate action), HIGH (this week), MEDIUM (this month), INFO (awareness)
   - Route to appropriate roles: CCO, CISO, Legal, BSA Officer
   - Include: summary, full text reference, impact assessment, recommended actions, deadline

REGULATORY KNOWLEDGE BASE:

BSA/AML (Bank Secrecy Act):
- 31 CFR 1010-1030: CTR, SAR, CMIR filing requirements
- FinCEN CDD Rule: Customer Due Diligence requirements
- Anti-Money Laundering Act of 2020: Beneficial Ownership
- Corporate Transparency Act: BOI reporting (effective 2024)

SOX (Sarbanes-Oxley):
- Section 302: CEO/CFO certification of financial reports
- Section 404: Internal control assessment
- Section 802: Document retention
- Section 906: Criminal penalties for fraud

HIPAA:
- Privacy Rule (45 CFR 164.500-534)
- Security Rule (45 CFR 164.302-318)
- Breach Notification Rule (45 CFR 164.400-414)

GDPR:
- Article 5: Data processing principles
- Article 6: Lawful basis for processing
- Article 9: Special categories of personal data
- Article 22: Automated individual decision-making
- Article 88: Processing in the employment context

EU AI Act:
- Risk classification (unacceptable, high, limited, minimal)
- Article 6: High-risk AI system requirements
- Annex III: High-risk AI use cases in employment
- Transparency obligations for AI-generated content

DORA (Digital Operational Resilience Act):
- ICT risk management framework
- Incident reporting requirements
- Digital operational resilience testing
- Third-party ICT risk management

When processing regulatory updates:
1. Always cite the specific regulation, section, and effective date
2. Assess compliance gap severity (critical/high/medium/low)
3. Provide natural language policy recommendations
4. Calculate time-to-compliance and resource requirements
5. Cross-reference with existing RiskRadar policies
6. Flag any conflicts between new and existing requirements`;

const regulatory_impact_tool: SkillTool = {
  name: 'regulatory_impact_assessment',
  description: 'Assess the impact of a regulatory change on current monitoring policies and generate recommended updates',
  parameters: {
    change: { type: 'object', description: '{source, title, effectiveDate, summary, fullTextUrl}', required: true },
    currentPolicies: { type: 'array', description: 'Array of current policy names and domains', required: true },
    industry: { type: 'string', description: 'Organization industry (banking, healthcare, etc.)', required: true },
  },
  execute: async (params) => {
    const change = params['change'] as {
      source: string;
      title: string;
      effectiveDate: string;
      summary: string;
      fullTextUrl?: string;
    };
    const currentPolicies = params['currentPolicies'] as Array<{ name: string; domain: string }>;
    const industry = params['industry'] as string;

    const daysUntilEffective = Math.ceil(
      (new Date(change.effectiveDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );

    const urgency = daysUntilEffective <= 30 ? 'CRITICAL'
      : daysUntilEffective <= 90 ? 'HIGH'
      : daysUntilEffective <= 180 ? 'MEDIUM'
      : 'LOW';

    return {
      regulatoryChange: {
        source: change.source,
        title: change.title,
        effectiveDate: change.effectiveDate,
        daysUntilEffective,
      },
      urgency,
      impactedDomains: ['finance', 'compliance'], // Would be AI-determined in production
      gapAnalysis: {
        coveredByExistingPolicies: currentPolicies.filter((p) => p.domain === 'compliance').length,
        totalRelevantPolicies: currentPolicies.length,
        gaps: ['New detection patterns not yet implemented', 'Threshold adjustments needed'],
      },
      recommendedActions: [
        {
          priority: 1,
          action: 'Review and update monitoring thresholds',
          deadline: change.effectiveDate,
          assignTo: 'compliance_officer',
        },
        {
          priority: 2,
          action: 'Create new detection policy for identified gaps',
          deadline: change.effectiveDate,
          assignTo: 'compliance_officer',
        },
        {
          priority: 3,
          action: 'Update analyst training materials',
          deadline: change.effectiveDate,
          assignTo: 'manager',
        },
      ],
      notificationTargets: urgency === 'CRITICAL'
        ? ['ciso', 'compliance_officer', 'admin']
        : urgency === 'HIGH'
        ? ['compliance_officer', 'manager']
        : ['compliance_officer'],
    };
  },
};

const gap_analysis_tool: SkillTool = {
  name: 'compliance_gap_analysis',
  description: 'Perform comprehensive gap analysis of current monitoring against regulatory requirements',
  parameters: {
    frameworks: { type: 'array', description: 'Regulatory frameworks to check (BSA_AML, SOX, HIPAA, etc.)', required: true },
    currentPolicies: { type: 'array', description: 'Array of {name, domain, regulatoryRef, isActive}', required: true },
    currentSignalTypes: { type: 'array', description: 'Currently monitored signal types', required: true },
  },
  execute: async (params) => {
    const frameworks = params['frameworks'] as string[];
    const policies = params['currentPolicies'] as Array<{ name: string; domain: string; regulatoryRef?: string; isActive: boolean }>;
    const signalTypes = params['currentSignalTypes'] as string[];

    // Framework requirement mappings
    const requirementMappings: Record<string, { requirements: string[]; requiredSignals: string[] }> = {
      BSA_AML: {
        requirements: [
          'Transaction monitoring for structuring',
          'SAR filing workflow',
          'CTR filing for >$10K',
          'Override monitoring',
          'New payee screening',
          'Insider threat detection',
          'Customer due diligence monitoring',
        ],
        requiredSignals: ['override_transaction', 'unusual_amount', 'new_payee', 'approval_bypass', 'after_hours_access'],
      },
      SOX: {
        requirements: [
          'Internal control monitoring',
          'Financial reporting anomaly detection',
          'Access control monitoring',
          'Segregation of duties enforcement',
          'Audit trail completeness',
        ],
        requiredSignals: ['approval_bypass', 'override_transaction', 'privilege_escalation', 'policy_violation'],
      },
      HIPAA: {
        requirements: [
          'PHI access monitoring',
          'Minimum necessary enforcement',
          'Breach detection',
          'Access audit logging',
          'Device security monitoring',
        ],
        requiredSignals: ['unusual_data_access', 'data_exfiltration', 'after_hours_access', 'privilege_escalation'],
      },
    };

    const results = frameworks.map((framework) => {
      const mapping = requirementMappings[framework];
      if (!mapping) return { framework, status: 'unknown', coverage: 0 };

      const coveredReqs = mapping.requirements.filter((req) =>
        policies.some((p) => p.regulatoryRef?.includes(framework) && p.isActive),
      );

      const coveredSignals = mapping.requiredSignals.filter((s) => signalTypes.includes(s));
      const missingSignals = mapping.requiredSignals.filter((s) => !signalTypes.includes(s));

      const coverage = Math.round(
        ((coveredReqs.length / mapping.requirements.length) * 0.5 +
          (coveredSignals.length / mapping.requiredSignals.length) * 0.5) *
          100,
      );

      return {
        framework,
        coverage: coverage + '%',
        status: coverage >= 80 ? 'COMPLIANT' : coverage >= 50 ? 'PARTIAL' : 'NON_COMPLIANT',
        totalRequirements: mapping.requirements.length,
        coveredRequirements: coveredReqs.length,
        gaps: mapping.requirements.filter((r) => !coveredReqs.includes(r)),
        missingSignals,
        coveredSignals,
        remediationEffort: coverage >= 80 ? 'LOW' : coverage >= 50 ? 'MEDIUM' : 'HIGH',
      };
    });

    const overallCoverage = results.reduce((sum, r) => sum + (typeof r.coverage === 'string' ? parseInt(r.coverage) : 0), 0) / results.length;

    return {
      overallCoverage: Math.round(overallCoverage) + '%',
      overallStatus: overallCoverage >= 80 ? 'COMPLIANT' : overallCoverage >= 50 ? 'PARTIAL' : 'NON_COMPLIANT',
      frameworkResults: results,
      prioritizedGaps: results
        .filter((r) => r.status !== 'COMPLIANT' && 'gaps' in r)
        .flatMap((r) => ('gaps' in r ? r.gaps!.map((g: string) => ({ framework: r.framework, gap: g })) : []))
        .slice(0, 10),
    };
  },
};

const skill: Skill = {
  id: 'regulatory.watchdog',
  name: 'Regulatory Watchdog',
  version: '1.0.0',
  domain: 'compliance',
  tier: 'regulatory',
  description: 'Always-on regulatory monitoring: FinCEN, OCC, FDIC, SEC, CFPB, EU regulators. Auto-impact assessment, gap analysis, and team notification.',
  systemPrompt,
  tools: [regulatory_impact_tool, gap_analysis_tool],
};

registerSkill(skill);
export default skill;
