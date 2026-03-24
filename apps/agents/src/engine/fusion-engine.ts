import { prisma } from '@riskradar/database';
import { createLogger } from '@riskradar/logger';
import type { NormalizedSignalEvent, RiskDomainType } from '@riskradar/shared';
import type { ModelRouter } from '../lib/model-router.js';

const logger = createLogger('fusion-engine');

/**
 * Cross-Domain Risk Fusion Engine
 *
 * The primary differentiator of RiskRadar: correlates signals across
 * HR, finance, security, operations, and communications to detect
 * compound risk patterns invisible to single-domain tools.
 *
 * Detection Methods:
 * 1. Temporal Correlation — Signals from different domains clustering in time
 * 2. Subject Correlation — Multiple signal types for the same subject
 * 3. Pattern Matching — Known compound risk signatures
 * 4. Anomaly Scoring — Deviation from digital twin baselines
 * 5. AI Reasoning — Nemotron deep analysis of ambiguous patterns
 */
export class FusionEngine {
  private modelRouter: ModelRouter;
  private signalBuffer: Map<string, NormalizedSignalEvent[]> = new Map();
  private bufferFlushInterval: ReturnType<typeof setInterval> | null = null;

  constructor(modelRouter: ModelRouter) {
    this.modelRouter = modelRouter;
  }

  start(): void {
    // Flush buffer every 60 seconds to check for compound patterns
    this.bufferFlushInterval = setInterval(() => {
      this.flushAndAnalyze();
    }, 60 * 1000);
    logger.info('Fusion engine started');
  }

  stop(): void {
    if (this.bufferFlushInterval) {
      clearInterval(this.bufferFlushInterval);
      this.bufferFlushInterval = null;
    }
  }

  /**
   * Ingest a signal from a domain collector agent.
   * Signals are buffered per subject for compound analysis.
   */
  ingestSignal(signal: NormalizedSignalEvent): void {
    const key = `${signal.tenantId}:${signal.subjectId}`;
    const buffer = this.signalBuffer.get(key) ?? [];
    buffer.push(signal);

    // Keep only last 100 signals per subject (sliding window)
    if (buffer.length > 100) {
      buffer.shift();
    }

    this.signalBuffer.set(key, buffer);

    // Check for immediate high-priority patterns
    if (this.isHighPrioritySignal(signal)) {
      this.analyzeSubject(signal.tenantId, signal.subjectId, buffer);
    }
  }

  /**
   * Analyze all buffered signals for a subject to detect compound risk patterns.
   */
  async analyzeSubject(
    tenantId: string,
    subjectId: string,
    signals: NormalizedSignalEvent[],
  ): Promise<CompoundRiskResult | null> {
    if (signals.length < 2) return null;

    // Step 1: Temporal clustering — are signals from multiple domains
    // clustering within a short time window?
    const temporalClusters = this.findTemporalClusters(signals, 7 * 24 * 60 * 60 * 1000); // 7 day window

    // Step 2: Domain diversity — more domains = higher compound risk
    const domains = new Set(signals.map((s) => s.domain));
    const domainDiversity = domains.size / 7; // 7 total domains

    // Step 3: Check against digital twin baseline
    const deviationScore = await this.checkDigitalTwinDeviation(tenantId, subjectId, signals);

    // Step 4: Calculate compound score
    const compoundScore = this.calculateCompoundScore({
      signalCount: signals.length,
      domainDiversity,
      temporalClusterDensity: temporalClusters.maxDensity,
      deviationScore,
    });

    if (compoundScore < 25) return null; // Below threshold

    // Step 5: For significant patterns, use AI reasoning to build evidence chain
    let evidenceChain: EvidenceChainItem[] = [];
    let reasoning: string | undefined;

    if (compoundScore >= 50) {
      const aiAnalysis = await this.performAIAnalysis(tenantId, subjectId, signals, compoundScore);
      evidenceChain = aiAnalysis.evidenceChain;
      reasoning = aiAnalysis.reasoning;
    } else {
      // Simple evidence chain for lower scores
      evidenceChain = signals
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        .map((s, i) => ({
          sequence: i + 1,
          timestamp: s.timestamp.toISOString(),
          description: `${s.signalType} detected in ${s.domain}`,
          sourceSystem: s.sourceSystem,
          signalType: s.signalType,
          domain: s.domain,
        }));
    }

    const result: CompoundRiskResult = {
      tenantId,
      subjectId,
      compoundScore,
      domains: [...domains] as RiskDomainType[],
      signalIds: signals.map((s) => s.signalId),
      evidenceChain,
      reasoning,
      requiresDeepReasoning: compoundScore >= 70,
    };

    logger.info(
      {
        subjectId,
        compoundScore,
        domainCount: domains.size,
        signalCount: signals.length,
      },
      'Compound risk detected',
    );

    return result;
  }

  // ─── Private Methods ──────────────────────────────────────

  private async flushAndAnalyze(): Promise<void> {
    for (const [key, signals] of this.signalBuffer.entries()) {
      if (signals.length < 2) continue;

      const [tenantId, subjectId] = key.split(':');
      if (!tenantId || !subjectId) continue;

      try {
        await this.analyzeSubject(tenantId, subjectId, signals);
      } catch (error) {
        logger.error({ error, subjectId }, 'Fusion analysis failed');
      }
    }

    // Clean old signals from buffer (older than 30 days)
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    for (const [key, signals] of this.signalBuffer.entries()) {
      const filtered = signals.filter((s) => s.timestamp.getTime() > cutoff);
      if (filtered.length === 0) {
        this.signalBuffer.delete(key);
      } else {
        this.signalBuffer.set(key, filtered);
      }
    }
  }

  private findTemporalClusters(
    signals: NormalizedSignalEvent[],
    windowMs: number,
  ): { maxDensity: number; clusters: NormalizedSignalEvent[][] } {
    const sorted = [...signals].sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    const clusters: NormalizedSignalEvent[][] = [];
    let currentCluster: NormalizedSignalEvent[] = [];
    let maxDensity = 0;

    for (const signal of sorted) {
      if (currentCluster.length === 0) {
        currentCluster.push(signal);
        continue;
      }

      const lastInCluster = currentCluster[currentCluster.length - 1]!;
      if (signal.timestamp.getTime() - lastInCluster.timestamp.getTime() <= windowMs) {
        currentCluster.push(signal);
      } else {
        if (currentCluster.length >= 2) {
          clusters.push(currentCluster);
          const domains = new Set(currentCluster.map((s) => s.domain));
          const density = (currentCluster.length * domains.size) / 10;
          maxDensity = Math.max(maxDensity, density);
        }
        currentCluster = [signal];
      }
    }

    if (currentCluster.length >= 2) {
      clusters.push(currentCluster);
      const domains = new Set(currentCluster.map((s) => s.domain));
      const density = (currentCluster.length * domains.size) / 10;
      maxDensity = Math.max(maxDensity, density);
    }

    return { maxDensity: Math.min(maxDensity, 1.0), clusters };
  }

  private async checkDigitalTwinDeviation(
    tenantId: string,
    subjectId: string,
    signals: NormalizedSignalEvent[],
  ): Promise<number> {
    // Get the subject's role archetype
    const meta = signals[0]?.metadata as Record<string, unknown> | undefined;
    const role = (meta?.['role'] as string) ?? 'unknown';

    const twin = await prisma.digitalTwin.findFirst({
      where: { tenantId, roleArchetype: role },
    });

    if (!twin) return 0.5; // No baseline, assume moderate deviation

    const baseline = twin.baselineData as Record<
      string,
      { mean: number; stddev: number; count: number }
    >;

    let totalDeviation = 0;
    let measuredSignals = 0;

    for (const signal of signals) {
      const baselineStats = baseline[signal.signalType];
      if (baselineStats && signal.value != null && baselineStats.stddev > 0) {
        const zScore = Math.abs(signal.value - baselineStats.mean) / baselineStats.stddev;
        totalDeviation += Math.min(zScore / 3, 1.0); // Normalize to 0-1
        measuredSignals++;
      }
    }

    return measuredSignals > 0 ? totalDeviation / measuredSignals : 0.5;
  }

  private calculateCompoundScore(factors: {
    signalCount: number;
    domainDiversity: number;
    temporalClusterDensity: number;
    deviationScore: number;
  }): number {
    const weights = {
      signalCount: 0.15,
      domainDiversity: 0.30,
      temporalCluster: 0.25,
      deviation: 0.30,
    };

    const normalizedSignalCount = Math.min(factors.signalCount / 10, 1.0);

    const score =
      normalizedSignalCount * weights.signalCount * 100 +
      factors.domainDiversity * weights.domainDiversity * 100 +
      factors.temporalClusterDensity * weights.temporalCluster * 100 +
      factors.deviationScore * weights.deviation * 100;

    return Math.round(Math.min(score, 100));
  }

  private async performAIAnalysis(
    tenantId: string,
    subjectId: string,
    signals: NormalizedSignalEvent[],
    compoundScore: number,
  ): Promise<{ evidenceChain: EvidenceChainItem[]; reasoning: string }> {
    const signalSummary = signals
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      .map(
        (s, i) =>
          `${i + 1}. [${s.timestamp.toISOString()}] Domain: ${s.domain}, Signal: ${s.signalType}, Source: ${s.sourceSystem}${s.value != null ? `, Value: ${s.value}` : ''}`,
      )
      .join('\n');

    const response = await this.modelRouter.infer({
      systemPrompt: `You are a risk analysis AI for an enterprise monitoring system. Analyze the following signals for subject ${subjectId} and determine if they represent a compound risk pattern. Be specific, cite each signal by number, and explain the correlation. If applicable, reference relevant regulatory requirements (BSA/AML, SOX, HIPAA, etc.).

Output JSON with:
- evidenceChain: array of {sequence, description, signalRef, significance}
- reasoning: string explaining the compound pattern
- regulatoryReferences: array of {regulation, section, relevance}
- recommendedActions: array of {priority, action}`,
      prompt: `Compound score: ${compoundScore}/100
Signals for analysis:
${signalSummary}`,
      requireReasoning: compoundScore >= 70,
      maxTokens: 2048,
    });

    try {
      const parsed = JSON.parse(response.content);
      return {
        evidenceChain: (parsed.evidenceChain ?? []).map(
          (item: Record<string, unknown>, i: number) => ({
            sequence: i + 1,
            timestamp: signals[i]?.timestamp.toISOString() ?? '',
            description: String(item['description'] ?? ''),
            sourceSystem: signals[i]?.sourceSystem ?? '',
            signalType: signals[i]?.signalType ?? '',
            domain: signals[i]?.domain ?? '',
          }),
        ),
        reasoning: parsed.reasoning ?? response.content,
      };
    } catch {
      // If AI response isn't valid JSON, use it as reasoning text
      return {
        evidenceChain: signals.map((s, i) => ({
          sequence: i + 1,
          timestamp: s.timestamp.toISOString(),
          description: `${s.signalType} from ${s.sourceSystem}`,
          sourceSystem: s.sourceSystem,
          signalType: s.signalType,
          domain: s.domain,
        })),
        reasoning: response.content,
      };
    }
  }

  private isHighPrioritySignal(signal: NormalizedSignalEvent): boolean {
    const highPriority = [
      'override_transaction',
      'data_exfiltration',
      'privilege_escalation',
      'regulatory_breach',
      'approval_bypass',
    ];
    return highPriority.includes(signal.signalType);
  }
}

// ─── Types ──────────────────────────────────────────────────

export interface CompoundRiskResult {
  tenantId: string;
  subjectId: string;
  compoundScore: number;
  domains: RiskDomainType[];
  signalIds: string[];
  evidenceChain: EvidenceChainItem[];
  reasoning?: string;
  requiresDeepReasoning: boolean;
}

export interface EvidenceChainItem {
  sequence: number;
  timestamp: string;
  description: string;
  sourceSystem: string;
  signalType: string;
  domain: string;
}
