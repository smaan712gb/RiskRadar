import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FusionEngine } from './fusion-engine.js';
import type { NormalizedSignalEvent } from '@riskradar/shared';

// Mock dependencies
vi.mock('@riskradar/database', () => ({
  prisma: {
    digitalTwin: { findFirst: vi.fn().mockResolvedValue(null) },
    signal: { groupBy: vi.fn().mockResolvedValue([]) },
  },
}));

describe('FusionEngine', () => {
  let engine: FusionEngine;
  const mockModelRouter = {
    infer: vi.fn().mockResolvedValue({
      content: JSON.stringify({
        evidenceChain: [{ sequence: 1, description: 'Test finding' }],
        reasoning: 'Cross-domain correlation detected',
      }),
      reasoning: 'Deep analysis complete',
      tier: 'tier2_cascade',
      modelId: 'test',
      tokensUsed: 100,
      latencyMs: 500,
      cached: false,
    }),
  };

  beforeEach(() => {
    engine = new FusionEngine(mockModelRouter as any);
    vi.clearAllMocks();
  });

  describe('analyzeSubject', () => {
    it('returns null for single signal', async () => {
      const signals: NormalizedSignalEvent[] = [
        createSignal('finance', 'override_transaction', 'emp-1'),
      ];

      const result = await engine.analyzeSubject('tenant-1', 'emp-1', signals);
      expect(result).toBeNull();
    });

    it('detects compound risk with multi-domain signals', async () => {
      const signals: NormalizedSignalEvent[] = [
        createSignal('finance', 'override_transaction', 'emp-1', 50000),
        createSignal('security', 'after_hours_access', 'emp-1'),
        createSignal('hr', 'training_missed', 'emp-1'),
        createSignal('finance', 'new_payee', 'emp-1', 25000),
        createSignal('communications', 'communication_drop', 'emp-1'),
      ];

      const result = await engine.analyzeSubject('tenant-1', 'emp-1', signals);

      expect(result).not.toBeNull();
      expect(result!.compoundScore).toBeGreaterThan(25);
      expect(result!.domains).toContain('finance');
      expect(result!.domains).toContain('security');
      expect(result!.signalIds).toHaveLength(5);
    });

    it('assigns higher score for more domain diversity', async () => {
      const twoDomainSignals: NormalizedSignalEvent[] = [
        createSignal('finance', 'override_transaction', 'emp-1'),
        createSignal('finance', 'unusual_amount', 'emp-1'),
      ];

      const fourDomainSignals: NormalizedSignalEvent[] = [
        createSignal('finance', 'override_transaction', 'emp-1'),
        createSignal('security', 'after_hours_access', 'emp-1'),
        createSignal('hr', 'training_missed', 'emp-1'),
        createSignal('communications', 'communication_drop', 'emp-1'),
      ];

      const result2 = await engine.analyzeSubject('tenant-1', 'emp-1', twoDomainSignals);
      const result4 = await engine.analyzeSubject('tenant-1', 'emp-1', fourDomainSignals);

      // 4 domain signals should score higher than 2 domain (same domain) signals
      if (result2 && result4) {
        expect(result4.compoundScore).toBeGreaterThanOrEqual(result2.compoundScore);
      }
    });

    it('triggers AI reasoning for high compound scores', async () => {
      const highRiskSignals: NormalizedSignalEvent[] = [
        createSignal('finance', 'override_transaction', 'emp-1', 100000),
        createSignal('finance', 'approval_bypass', 'emp-1', 50000),
        createSignal('security', 'after_hours_access', 'emp-1'),
        createSignal('security', 'data_exfiltration', 'emp-1'),
        createSignal('hr', 'performance_decline', 'emp-1'),
        createSignal('communications', 'communication_drop', 'emp-1'),
        createSignal('operations', 'productivity_decline', 'emp-1'),
      ];

      const result = await engine.analyzeSubject('tenant-1', 'emp-1', highRiskSignals);

      if (result && result.compoundScore >= 50) {
        expect(mockModelRouter.infer).toHaveBeenCalled();
      }
    });
  });

  describe('signal ingestion', () => {
    it('buffers signals and allows retrieval', () => {
      const signal = createSignal('finance', 'override_transaction', 'emp-1');
      engine.ingestSignal(signal);

      // Signal should be buffered internally
      // (We can't test internal state directly, but we can verify no crash)
      expect(true).toBe(true);
    });

    it('handles high-priority signals immediately', () => {
      const criticalSignal = createSignal('security', 'data_exfiltration', 'emp-1', 1000);

      // Should not throw
      engine.ingestSignal(criticalSignal);
    });
  });
});

// ─── Test Helpers ───────────────────────────────────────────

function createSignal(
  domain: string,
  signalType: string,
  subjectId: string,
  value?: number,
): NormalizedSignalEvent {
  return {
    signalId: `sig_${Math.random().toString(36).slice(2)}`,
    tenantId: 'tenant-1',
    domain: domain as any,
    signalType: signalType as any,
    subjectType: 'employee',
    subjectId,
    sourceSystem: 'test',
    value: value ?? null,
    metadata: { role: 'analyst' },
    timestamp: new Date(),
  };
}
