import { prisma } from '@riskradar/database';
import type { NormalizedSignalEvent } from '@riskradar/shared';
import { BaseAgent, type AgentConfig } from '../base-agent.js';
import type { AgentMessage } from '../../messaging/agent-bus.js';

/**
 * Regulatory Watchdog Agent
 *
 * An always-on agent that:
 * 1. Continuously searches regulatory sources for new/changed regulations
 * 2. Assesses impact on current monitoring policies
 * 3. Auto-generates policy update recommendations
 * 4. Notifies the compliance team of changes
 * 5. Maintains a living regulatory knowledge base
 * 6. Runs gap analysis on a schedule
 *
 * Uses OpenClaw's built-in search skills (Exa, Tavily, Firecrawl)
 * to monitor regulatory websites in real-time.
 */

const REGULATORY_SOURCES = [
  { name: 'FinCEN', url: 'https://www.fincen.gov/news-room', category: 'AML', priority: 1 },
  { name: 'OCC Bulletins', url: 'https://www.occ.gov/news-issuances', category: 'Banking', priority: 1 },
  { name: 'FDIC FILs', url: 'https://www.fdic.gov/news/financial-institution-letters', category: 'Banking', priority: 1 },
  { name: 'SEC', url: 'https://www.sec.gov/news', category: 'Securities', priority: 1 },
  { name: 'OFAC', url: 'https://ofac.treasury.gov/recent-actions', category: 'Sanctions', priority: 1 },
  { name: 'CFPB', url: 'https://www.consumerfinance.gov/rules-policy', category: 'Consumer', priority: 2 },
  { name: 'Fed Reserve', url: 'https://www.federalreserve.gov/supervisionreg', category: 'Banking', priority: 2 },
  { name: 'NIST', url: 'https://www.nist.gov/cyberframework', category: 'Cybersecurity', priority: 2 },
  { name: 'EU EBA', url: 'https://www.eba.europa.eu/regulation-and-policy', category: 'EU_Banking', priority: 2 },
  { name: 'FATF', url: 'https://www.fatf-gafi.org/en/publications', category: 'AML_Intl', priority: 3 },
  { name: 'Basel Committee', url: 'https://www.bis.org/bcbs/publications', category: 'Capital', priority: 3 },
  { name: 'HHS OCR', url: 'https://www.hhs.gov/hipaa/for-professionals', category: 'Healthcare', priority: 2 },
];

export class RegulatoryWatchdogAgent extends BaseAgent {
  private lastCheckTimestamps = new Map<string, Date>();
  private knownRegulations = new Set<string>();

  static createConfig(): AgentConfig {
    return {
      id: 'regulatory-watchdog',
      name: 'Regulatory Watchdog',
      team: 'analysis',
      domain: 'compliance',
      schedule: '6h', // Check every 6 hours
      modelTier: 'tier2_cascade', // Uses deep reasoning for impact analysis
      dataSources: ['regulatory_sources', 'web_search'],
      enabled: true,
    };
  }

  protected async onInit(): Promise<void> {
    this.logger.info('Initializing Regulatory Watchdog Agent');

    // Load existing regulatory rules to avoid duplicates
    const existing = await prisma.regulatoryRule.findMany({
      where: { isActive: true },
      select: { framework: true, section: true },
    });

    for (const rule of existing) {
      this.knownRegulations.add(`${rule.framework}:${rule.section}`);
    }

    this.logger.info(
      { knownRules: this.knownRegulations.size },
      'Loaded existing regulatory knowledge base',
    );
  }

  protected async onHeartbeat(): Promise<void> {
    this.logger.info('Running regulatory scan cycle');

    // Scan each source tier based on priority
    for (const source of REGULATORY_SOURCES) {
      try {
        await this.scanSource(source);
      } catch (error) {
        this.logger.error(
          { error, source: source.name },
          'Failed to scan regulatory source',
        );
      }
    }

    // Run periodic gap analysis (daily)
    const lastGapAnalysis = this.lastCheckTimestamps.get('gap_analysis');
    if (!lastGapAnalysis || Date.now() - lastGapAnalysis.getTime() > 24 * 60 * 60 * 1000) {
      await this.runGapAnalysis();
      this.lastCheckTimestamps.set('gap_analysis', new Date());
    }
  }

  protected async onSignal(_signal: NormalizedSignalEvent): Promise<void> {
    // Listen for compliance-related signals that might indicate regulatory relevance
    if (_signal.signalType === 'regulatory_breach' || _signal.signalType === 'policy_violation') {
      this.logger.info(
        { signalType: _signal.signalType },
        'Compliance signal received — checking for related regulatory updates',
      );
    }
  }

  protected async onMessage(message: AgentMessage): Promise<void> {
    if (message.type === 'check_regulation') {
      const framework = message.payload['framework'] as string;
      if (framework) {
        await this.checkSpecificFramework(framework);
      }
    }

    if (message.type === 'run_gap_analysis') {
      await this.runGapAnalysis();
    }
  }

  protected async onShutdown(): Promise<void> {
    this.logger.info('Regulatory Watchdog shutting down');
  }

  // ─── Core Logic ───────────────────────────────────────────

  private async scanSource(source: typeof REGULATORY_SOURCES[number]): Promise<void> {
    const lastCheck = this.lastCheckTimestamps.get(source.name) ?? new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Use AI to search for recent regulatory updates
    const searchPrompt = `Search for new regulatory updates, advisories, bulletins, or enforcement actions from ${source.name} (${source.url}) published after ${lastCheck.toISOString().split('T')[0]}.

Focus on changes that affect:
- Anti-money laundering and Bank Secrecy Act requirements
- Customer due diligence obligations
- Transaction monitoring requirements
- Insider threat and fraud detection
- Data privacy and protection
- Cybersecurity requirements
- Employee monitoring regulations

For each update found, provide:
1. Title
2. Publication date
3. Brief summary (2-3 sentences)
4. Affected regulations/sections
5. Impact severity (critical/high/medium/low)
6. URL to full text

Return JSON array of findings. If no new updates, return empty array [].`;

    const response = await this.reason(
      searchPrompt,
      'You are a regulatory research assistant. Return structured JSON data about regulatory changes.',
      { requireReasoning: false, maxTokens: 2048 },
    );

    let findings: RegulatoryFinding[];
    try {
      const parsed = JSON.parse(response.content);
      findings = Array.isArray(parsed) ? parsed : [];
    } catch {
      findings = [];
    }

    this.lastCheckTimestamps.set(source.name, new Date());

    if (findings.length === 0) {
      this.logger.debug({ source: source.name }, 'No new regulatory updates');
      return;
    }

    this.logger.info(
      { source: source.name, findings: findings.length },
      'New regulatory updates found',
    );

    // Process each finding
    for (const finding of findings) {
      const key = `${source.category}:${finding.title}`;
      if (this.knownRegulations.has(key)) continue;

      await this.processRegulatoryChange(source, finding);
      this.knownRegulations.add(key);
    }
  }

  private async processRegulatoryChange(
    source: typeof REGULATORY_SOURCES[number],
    finding: RegulatoryFinding,
  ): Promise<void> {
    this.logger.info(
      { title: finding.title, severity: finding.severity },
      'Processing regulatory change',
    );

    // Deep impact analysis using Tier 2 reasoning
    const impactResponse = await this.reason(
      `Analyze this regulatory change and determine its impact on an enterprise risk monitoring system:

Regulation: ${finding.title}
Source: ${source.name} (${source.category})
Summary: ${finding.summary}
Effective Date: ${finding.effectiveDate ?? 'Not specified'}

Current monitoring capabilities:
- Transaction override monitoring
- After-hours access detection
- Employee behavioral analytics
- Financial anomaly detection
- Data exfiltration prevention
- Compliance gap detection

Determine:
1. Which monitoring domains are affected (hr, finance, security, operations, communications, compliance)
2. What new signal types should be added
3. What existing thresholds need adjustment
4. What new detection policies are needed (describe in natural language)
5. Compliance deadline urgency

Return JSON:
{
  "affectedDomains": ["domain1", "domain2"],
  "newSignalTypes": [{"type": "signal_name", "description": "what to detect"}],
  "thresholdChanges": [{"signal": "signal_type", "change": "description"}],
  "policyRecommendations": [{"name": "policy name", "description": "what it monitors", "urgency": "critical|high|medium|low"}],
  "complianceDeadline": "ISO date or null",
  "overallImpact": "critical|high|medium|low",
  "summary": "2-3 sentence impact summary"
}`,
      'You are a senior compliance officer analyzing regulatory changes for a risk monitoring platform. Be specific and actionable.',
      { requireReasoning: true, maxTokens: 2048 },
    );

    let impact: RegulatoryImpact;
    try {
      impact = JSON.parse(impactResponse.content);
    } catch {
      impact = {
        affectedDomains: ['compliance'],
        newSignalTypes: [],
        thresholdChanges: [],
        policyRecommendations: [],
        complianceDeadline: null,
        overallImpact: 'medium',
        summary: finding.summary,
      };
    }

    // Store in regulatory knowledge base
    await prisma.regulatoryRule.create({
      data: {
        framework: source.category,
        section: finding.title.slice(0, 200),
        title: finding.title,
        description: finding.summary,
        requirements: {
          policyRecommendations: impact.policyRecommendations,
          thresholdChanges: impact.thresholdChanges,
        },
        signalMappings: impact.newSignalTypes.map((s) => s.type),
        industries: ['banking', 'credit_union'], // Default; would be AI-determined
        jurisdictions: source.category.startsWith('EU') ? ['EU'] : ['US'],
        effectiveDate: impact.complianceDeadline ? new Date(impact.complianceDeadline) : null,
        isActive: true,
      },
    });

    // Notify compliance team via agent messaging
    await this.broadcastToTeam('response', 'regulatory_update', {
      source: source.name,
      title: finding.title,
      severity: impact.overallImpact,
      summary: impact.summary,
      affectedDomains: impact.affectedDomains,
      policyRecommendations: impact.policyRecommendations,
      complianceDeadline: impact.complianceDeadline,
      url: finding.url,
    });

    // If critical, send immediate notification
    if (impact.overallImpact === 'critical') {
      await this.sendMessage('notification-agent', 'urgent_notification', {
        channel: 'all',
        templateId: 'regulatory_critical',
        payload: {
          title: `CRITICAL: ${finding.title}`,
          summary: impact.summary,
          deadline: impact.complianceDeadline,
          actions: impact.policyRecommendations,
        },
      });
    }
  }

  private async runGapAnalysis(): Promise<void> {
    this.logger.info('Running scheduled regulatory gap analysis');

    const policies = await prisma.policy.findMany({
      where: { isActive: true },
      select: { name: true, domain: true, regulatoryRef: true },
    });

    const rules = await prisma.regulatoryRule.findMany({
      where: { isActive: true },
    });

    // Use AI to assess overall compliance posture
    const gapResponse = await this.reason(
      `Analyze the compliance posture of this organization.

Active Monitoring Policies (${policies.length}):
${policies.map((p) => `- ${p.name} (${p.domain}) [Ref: ${p.regulatoryRef ?? 'none'}]`).join('\n')}

Regulatory Requirements (${rules.length}):
${rules.map((r) => `- ${r.framework} ${r.section}: ${r.title}`).join('\n')}

Identify:
1. Regulatory requirements not covered by any active policy
2. Policies that reference outdated regulatory sections
3. Domains with inadequate coverage
4. Overall compliance score (0-100)
5. Top 5 priority remediation items

Return structured JSON.`,
      'You are a bank examiner performing a compliance review. Be thorough and cite specific gaps.',
      { requireReasoning: true, maxTokens: 2048 },
    );

    // Broadcast results
    await this.broadcastToTeam('response', 'gap_analysis_complete', {
      timestamp: new Date().toISOString(),
      policyCount: policies.length,
      ruleCount: rules.length,
      analysis: gapResponse.content,
      reasoning: gapResponse.reasoning,
    });

    this.logger.info('Gap analysis complete');
  }

  private async checkSpecificFramework(framework: string): Promise<void> {
    const rules = await prisma.regulatoryRule.findMany({
      where: { framework, isActive: true },
    });

    this.logger.info(
      { framework, ruleCount: rules.length },
      'Checking specific regulatory framework',
    );
  }
}

// ─── Types ──────────────────────────────────────────────────

interface RegulatoryFinding {
  title: string;
  publicationDate?: string;
  summary: string;
  affectedSections?: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  url?: string;
  effectiveDate?: string;
}

interface RegulatoryImpact {
  affectedDomains: string[];
  newSignalTypes: Array<{ type: string; description: string }>;
  thresholdChanges: Array<{ signal: string; change: string }>;
  policyRecommendations: Array<{ name: string; description: string; urgency: string }>;
  complianceDeadline: string | null;
  overallImpact: string;
  summary: string;
}
