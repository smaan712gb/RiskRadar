import { describe, it, expect, beforeAll, vi } from 'vitest';

/**
 * E2E Tests: IC3 2025 Feature Enhancement Suite
 *
 * Validates the complete IC3 2025 threat intelligence features:
 * - New threat domains (crypto, BEC, ransomware, AI threat, vendor risk)
 * - IC3 threat landscape data
 * - New alert types with evidence chains
 * - New detection modules and agents
 * - Threat intelligence page data
 * - Updated reports and signals
 */

// ─── Import Demo Data ──────────────────────────────────────
import {
  DEMO_ALERTS,
  DEMO_CASES,
  DEMO_POLICIES,
  DEMO_INTEGRATIONS,
  DEMO_AGENTS,
  DEMO_KPIS,
  DEMO_SIGNAL_STATS,
  DEMO_RISK_DISTRIBUTION,
  DEMO_RISK_SCORES,
  IC3_THREAT_DATA,
  DEMO_VENDOR_RISKS,
  TFCU_TENANT,
} from '../apps/web/src/lib/demo-data';

// ─── IC3 Threat Landscape Data ─────────────────────────────
describe('IC3 2025 Threat Landscape Data', () => {
  it('should contain FBI IC3 2025 report headline numbers', () => {
    expect(IC3_THREAT_DATA.reportYear).toBe(2025);
    expect(IC3_THREAT_DATA.totalComplaints).toBe(1_000_000);
    expect(IC3_THREAT_DATA.totalLosses).toBe(20_000_000_000);
  });

  it('should have all top threat categories from the IC3 report', () => {
    const categories = IC3_THREAT_DATA.topThreats.map((t) => t.category);
    expect(categories).toContain('Investment Fraud');
    expect(categories).toContain('Crypto Fraud');
    expect(categories).toContain('Business Email Compromise');
    expect(categories).toContain('AI-Enabled Scams');
    expect(categories).toContain('Ransomware');
    expect(categories).toContain('Elder Fraud (60+)');
    expect(categories).toContain('Tech Support Fraud');
  });

  it('should have correct loss amounts for top categories', () => {
    const investmentFraud = IC3_THREAT_DATA.topThreats.find((t) => t.category === 'Investment Fraud');
    expect(investmentFraud?.losses).toBe(8_600_000_000);

    const bec = IC3_THREAT_DATA.topThreats.find((t) => t.category === 'Business Email Compromise');
    expect(bec?.losses).toBe(3_000_000_000);

    const aiScams = IC3_THREAT_DATA.topThreats.find((t) => t.category === 'AI-Enabled Scams');
    expect(aiScams?.losses).toBe(893_000_000);
    expect(aiScams?.trend).toBe('NEW');
  });

  it('should have module coverage for all P0 threats', () => {
    const p0Threats = IC3_THREAT_DATA.topThreats.filter((t) => t.priority === 'P0');
    expect(p0Threats.length).toBeGreaterThanOrEqual(4);
    p0Threats.forEach((t) => {
      expect(t.moduleStatus).toBe('active');
      expect(t.riskRadarModule).not.toBe('');
    });
  });

  it('should have organizational exposure score and coverage', () => {
    const exposure = IC3_THREAT_DATA.organizationExposure;
    expect(exposure.overallScore).toBeGreaterThan(0);
    expect(exposure.coveragePercentage).toBeGreaterThanOrEqual(80);
    expect(exposure.activeModules).toBeGreaterThanOrEqual(5);
    expect(exposure.coveredThreats.length).toBeGreaterThanOrEqual(4);
  });

  it('should have weekly trend data for tracking', () => {
    expect(IC3_THREAT_DATA.weeklyTrend.length).toBeGreaterThanOrEqual(4);
    IC3_THREAT_DATA.weeklyTrend.forEach((w) => {
      expect(w.week).toBeDefined();
      expect(w.score).toBeGreaterThan(0);
      expect(w.score).toBeLessThanOrEqual(100);
    });
  });
});

// ─── BEC Defense Suite ─────────────────────────────────────
describe('BEC Defense Suite', () => {
  const becAlert = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1210');

  it('should have a BEC alert with critical severity', () => {
    expect(becAlert).toBeDefined();
    expect(becAlert!.severity).toBe('critical');
    expect(becAlert!.compoundScore).toBeGreaterThanOrEqual(90);
    expect(becAlert!.domains).toContain('bec');
  });

  it('should detect writing style deviation in BEC alert', () => {
    const evidenceChain = becAlert!.evidenceBrief!.evidenceChain;
    const writingStyleEvidence = evidenceChain.find((e) => e.signalType === 'writing_style_deviation');
    expect(writingStyleEvidence).toBeDefined();
    expect(writingStyleEvidence!.sourceSystem).toContain('Email Analytics');
  });

  it('should detect unfamiliar device authentication', () => {
    const evidenceChain = becAlert!.evidenceBrief!.evidenceChain;
    const deviceEvidence = evidenceChain.find((e) => e.signalType === 'unfamiliar_device_auth');
    expect(deviceEvidence).toBeDefined();
  });

  it('should detect vendor payment change as BEC indicator', () => {
    const evidenceChain = becAlert!.evidenceBrief!.evidenceChain;
    const vendorEvidence = evidenceChain.find((e) => e.signalType === 'vendor_payment_change');
    expect(vendorEvidence).toBeDefined();
  });

  it('should map to FBI IC3 BEC Advisory', () => {
    const regulatoryMapping = becAlert!.evidenceBrief!.regulatoryMapping;
    const ic3Mapping = regulatoryMapping.find((r) => r.regulation === 'FBI IC3');
    expect(ic3Mapping).toBeDefined();
    expect(ic3Mapping!.section).toContain('BEC');
  });

  it('should recommend immediate wire transfer block', () => {
    const actions = becAlert!.evidenceBrief!.recommendedActions;
    const immediate = actions.filter((a) => a.priority === 'immediate');
    expect(immediate.length).toBeGreaterThanOrEqual(1);
    expect(immediate.some((a) => a.action.toLowerCase().includes('block'))).toBe(true);
  });

  it('should have BEC policies', () => {
    const becPolicies = DEMO_POLICIES.filter((p) => p.domain === 'bec');
    expect(becPolicies.length).toBeGreaterThanOrEqual(2);
    expect(becPolicies.some((p) => p.name.includes('BEC'))).toBe(true);
    expect(becPolicies.some((p) => p.name.includes('Vendor'))).toBe(true);
  });
});

// ─── Crypto Fraud Radar ────────────────────────────────────
describe('Crypto Fraud Radar', () => {
  const cryptoAlert = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1212');

  it('should have a crypto fraud (pig butchering) alert', () => {
    expect(cryptoAlert).toBeDefined();
    expect(cryptoAlert!.severity).toBe('high');
    expect(cryptoAlert!.domains).toContain('crypto');
    expect(cryptoAlert!.subjectType).toBe('member_account');
  });

  it('should detect escalating transfer pattern', () => {
    const evidenceChain = cryptoAlert!.evidenceBrief!.evidenceChain;
    const escalation = evidenceChain.find((e) => e.signalType === 'crypto_transfer_escalation');
    expect(escalation).toBeDefined();
    expect(escalation!.sourceSystem).toContain('Chainalysis');
  });

  it('should flag high-risk wallet via Chainalysis', () => {
    const evidenceChain = cryptoAlert!.evidenceBrief!.evidenceChain;
    const walletRisk = evidenceChain.find((e) => e.signalType === 'high_risk_wallet');
    expect(walletRisk).toBeDefined();
    expect(walletRisk!.sourceSystem).toContain('Chainalysis');
  });

  it('should detect rapid asset depletion', () => {
    const evidenceChain = cryptoAlert!.evidenceBrief!.evidenceChain;
    const depletion = evidenceChain.find((e) => e.signalType === 'rapid_asset_depletion');
    expect(depletion).toBeDefined();
  });

  it('should map to FinCEN crypto advisory', () => {
    const mapping = cryptoAlert!.evidenceBrief!.regulatoryMapping;
    expect(mapping.some((r) => r.regulation === 'FinCEN')).toBe(true);
  });

  it('should recommend member welfare check', () => {
    const actions = cryptoAlert!.evidenceBrief!.recommendedActions;
    expect(actions.some((a) => a.action.toLowerCase().includes('welfare') || a.action.toLowerCase().includes('contact member'))).toBe(true);
  });

  it('should have crypto integrations', () => {
    const chainalysis = DEMO_INTEGRATIONS.find((i) => i.name.includes('Chainalysis'));
    const trmLabs = DEMO_INTEGRATIONS.find((i) => i.name.includes('TRM Labs'));
    expect(chainalysis).toBeDefined();
    expect(chainalysis!.type).toBe('blockchain_analytics');
    expect(chainalysis!.status).toBe('connected');
    expect(trmLabs).toBeDefined();
  });

  it('should have crypto monitoring policies', () => {
    const cryptoPolicies = DEMO_POLICIES.filter((p) => p.domain === 'crypto');
    expect(cryptoPolicies.length).toBeGreaterThanOrEqual(2);
  });
});

// ─── Ransomware Exposure Engine ────────────────────────────
describe('Ransomware Exposure Engine', () => {
  const ransomwareAlert = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1215');

  it('should have a ransomware exposure alert', () => {
    expect(ransomwareAlert).toBeDefined();
    expect(ransomwareAlert!.domains).toContain('ransomware');
    expect(ransomwareAlert!.subjectType).toBe('infrastructure');
  });

  it('should have MITRE ATT&CK integration', () => {
    const mitre = DEMO_INTEGRATIONS.find((i) => i.name.includes('MITRE'));
    expect(mitre).toBeDefined();
    expect(mitre!.type).toBe('threat_intelligence');
    expect(mitre!.status).toBe('connected');
  });

  it('should have ransomware exposure policy', () => {
    const policy = DEMO_POLICIES.find((p) => p.name.includes('Ransomware'));
    expect(policy).toBeDefined();
    expect(policy!.regulatory).toContain('NIST');
  });
});

// ─── AI Threat Intelligence ────────────────────────────────
describe('AI Threat Intelligence', () => {
  const aiAlert = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1218');

  it('should have an AI phishing campaign alert', () => {
    expect(aiAlert).toBeDefined();
    expect(aiAlert!.domains).toContain('ai_threat');
    expect(aiAlert!.subjectType).toBe('external_threat');
  });

  it('should have AI threat intel integration', () => {
    const aiThreat = DEMO_INTEGRATIONS.find((i) => i.name.includes('AI Threat'));
    expect(aiThreat).toBeDefined();
    expect(aiThreat!.type).toBe('ai_threat_feed');
  });

  it('should have AI phishing detection policy', () => {
    const policy = DEMO_POLICIES.find((p) => p.name.includes('AI-Generated'));
    expect(policy).toBeDefined();
    expect(policy!.domain).toBe('ai_threat');
  });
});

// ─── Supply Chain / Vendor Risk ────────────────────────────
describe('Supply Chain Vendor Risk', () => {
  const vendorAlert = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1220');

  it('should have a vendor risk alert', () => {
    expect(vendorAlert).toBeDefined();
    expect(vendorAlert!.domains).toContain('vendor_risk');
    expect(vendorAlert!.subjectType).toBe('vendor');
  });

  it('should have SecurityScorecard integration', () => {
    const ssc = DEMO_INTEGRATIONS.find((i) => i.name.includes('SecurityScorecard'));
    expect(ssc).toBeDefined();
    expect(ssc!.type).toBe('vendor_risk');
  });

  it('should have vendor risk scores', () => {
    expect(DEMO_VENDOR_RISKS.length).toBeGreaterThanOrEqual(3);
    DEMO_VENDOR_RISKS.forEach((v) => {
      expect(v.riskScore).toBeGreaterThanOrEqual(0);
      expect(v.riskScore).toBeLessThanOrEqual(100);
      expect(v.securityRating).toBeDefined();
      expect(v.businessImpact).toBeDefined();
    });
  });

  it('should detect vendor rating downgrades', () => {
    const downgraded = DEMO_VENDOR_RISKS.find((v) => v.securityRating !== v.previousRating);
    expect(downgraded).toBeDefined();
    expect(downgraded!.name).toBe('Acme Payments');
  });

  it('should have supply chain monitoring policy', () => {
    const policy = DEMO_POLICIES.find((p) => p.name.includes('Supply Chain'));
    expect(policy).toBeDefined();
    expect(policy!.domain).toBe('vendor_risk');
  });
});

// ─── Updated Signal Domains ────────────────────────────────
describe('Expanded Signal Domains', () => {
  it('should have 10 signal domains (up from 5)', () => {
    const domains = Object.keys(DEMO_SIGNAL_STATS.byDomain);
    expect(domains.length).toBe(10);
    expect(domains).toContain('crypto');
    expect(domains).toContain('bec');
    expect(domains).toContain('ransomware');
    expect(domains).toContain('vendor_risk');
    expect(domains).toContain('ai_threat');
  });

  it('should have correct total signal count', () => {
    const sum = Object.values(DEMO_SIGNAL_STATS.byDomain).reduce((a, b) => a + b, 0);
    expect(sum).toBe(DEMO_SIGNAL_STATS.total24h);
    expect(DEMO_SIGNAL_STATS.total24h).toBeGreaterThan(3000);
  });

  it('should have crypto signals from Chainalysis', () => {
    expect(DEMO_SIGNAL_STATS.byDomain.crypto).toBeGreaterThan(0);
  });

  it('should have BEC signals from email analytics', () => {
    expect(DEMO_SIGNAL_STATS.byDomain.bec).toBeGreaterThan(0);
  });
});

// ─── Updated Agents ────────────────────────────────────────
describe('IC3 Detection Agents', () => {
  it('should have 5 new IC3 analysis agents', () => {
    const ic3Agents = DEMO_AGENTS.filter((a) =>
      ['agent-crypto', 'agent-bec', 'agent-aithreat', 'agent-vendor', 'agent-ransomware'].includes(a.id)
    );
    expect(ic3Agents.length).toBe(5);
  });

  it('should have crypto fraud detector running', () => {
    const crypto = DEMO_AGENTS.find((a) => a.id === 'agent-crypto');
    expect(crypto).toBeDefined();
    expect(crypto!.status).toBe('running');
    expect(crypto!.signals).toBeGreaterThan(0);
  });

  it('should have BEC analyzer running', () => {
    const bec = DEMO_AGENTS.find((a) => a.id === 'agent-bec');
    expect(bec).toBeDefined();
    expect(bec!.status).toBe('running');
  });

  it('should have total of 17 agents (12 original + 5 IC3)', () => {
    expect(DEMO_AGENTS.length).toBe(17);
  });
});

// ─── Updated KPIs ──────────────────────────────────────────
describe('Updated KPIs and Overview Data', () => {
  it('should have increased alert count reflecting new alerts', () => {
    expect(DEMO_KPIS.activeAlerts.value).toBe(12);
  });

  it('should have IC3 threat score KPI', () => {
    expect(DEMO_KPIS.ic3ThreatScore).toBeDefined();
    expect(DEMO_KPIS.ic3ThreatScore.value).toBeGreaterThan(0);
  });

  it('should have updated risk distribution', () => {
    const total = DEMO_RISK_DISTRIBUTION.critical + DEMO_RISK_DISTRIBUTION.high +
      DEMO_RISK_DISTRIBUTION.medium + DEMO_RISK_DISTRIBUTION.low;
    expect(total).toBe(19);
  });

  it('should have 12+ alerts total', () => {
    expect(DEMO_ALERTS.length).toBeGreaterThanOrEqual(12);
  });

  it('should have 13 integrations', () => {
    expect(DEMO_INTEGRATIONS.length).toBe(13);
  });

  it('should have 15 policies', () => {
    expect(DEMO_POLICIES.length).toBe(15);
  });
});

// ─── Cross-Domain Correlation ──────────────────────────────
describe('Cross-Domain IC3 Alert Correlation', () => {
  it('BEC alert should span bec + finance + security domains', () => {
    const bec = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1210');
    expect(bec!.domains).toContain('bec');
    expect(bec!.domains).toContain('finance');
    expect(bec!.domains).toContain('security');
  });

  it('Crypto alert should span crypto + finance domains', () => {
    const crypto = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1212');
    expect(crypto!.domains).toContain('crypto');
    expect(crypto!.domains).toContain('finance');
  });

  it('AI phishing alert should span ai_threat + security + communications', () => {
    const ai = DEMO_ALERTS.find((a) => a.id === 'ALT-2026-1218');
    expect(ai!.domains).toContain('ai_threat');
    expect(ai!.domains).toContain('security');
    expect(ai!.domains).toContain('communications');
  });

  it('All new alerts should have compound scores > 50', () => {
    const newAlertIds = ['ALT-2026-1210', 'ALT-2026-1212', 'ALT-2026-1215', 'ALT-2026-1218', 'ALT-2026-1220'];
    newAlertIds.forEach((id) => {
      const alert = DEMO_ALERTS.find((a) => a.id === id);
      expect(alert).toBeDefined();
      expect(alert!.compoundScore).toBeGreaterThan(50);
    });
  });
});

// ─── Data Integrity ────────────────────────────────────────
describe('Data Integrity Checks', () => {
  it('all alerts should have unique IDs', () => {
    const ids = DEMO_ALERTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all policies should have unique IDs', () => {
    const ids = DEMO_POLICIES.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all integrations should have unique IDs', () => {
    const ids = DEMO_INTEGRATIONS.map((i) => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all agents should have unique IDs', () => {
    const ids = DEMO_AGENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all vendor risks should have unique IDs', () => {
    const ids = DEMO_VENDOR_RISKS.map((v) => v.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all alerts should have valid severity values', () => {
    const validSeverities = ['critical', 'high', 'medium', 'low'];
    DEMO_ALERTS.forEach((a) => {
      expect(validSeverities).toContain(a.severity);
    });
  });

  it('all alerts should have compound scores in 0-100 range', () => {
    DEMO_ALERTS.forEach((a) => {
      expect(a.compoundScore).toBeGreaterThanOrEqual(0);
      expect(a.compoundScore).toBeLessThanOrEqual(100);
    });
  });

  it('tenant config should be consistent', () => {
    expect(TFCU_TENANT.industry).toBe('credit_union');
    expect(TFCU_TENANT.settings.regulatoryFrameworks).toContain('BSA_AML');
  });
});
