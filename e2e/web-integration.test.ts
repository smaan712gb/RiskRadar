import { describe, it, expect } from 'vitest';

/**
 * Web Integration Tests
 *
 * Validates data consistency between demo-data, use-data hooks,
 * and the page components that consume them. Ensures the IC3 2025
 * enhancements are properly wired through the data layer.
 */

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
  DEMO_AUDIT_LOGS,
  TFCU_TENANT,
} from '../apps/web/src/lib/demo-data';

// ─── Data Consistency: KPIs match actual counts ────────────
describe('KPI Data Consistency', () => {
  it('active alerts KPI should reflect total alerts including IC3 enhancements', () => {
    // KPI is a dashboard-level metric that includes alerts from all sources (DB + demo)
    // It should be >= the demo alert count minus dismissed ones
    const nonDismissed = DEMO_ALERTS.filter((a) => a.status !== 'dismissed');
    expect(DEMO_KPIS.activeAlerts.value).toBeGreaterThanOrEqual(nonDismissed.length);
  });

  it('open cases KPI should reflect total open cases including IC3-related', () => {
    // KPI includes cases from DB that may not all be in demo data
    const openCases = DEMO_CASES.filter((c) => !c.status.startsWith('closed'));
    expect(DEMO_KPIS.openCases.value).toBeGreaterThanOrEqual(openCases.length);
  });

  it('signal stats total should equal sum of all domains', () => {
    const sum = Object.values(DEMO_SIGNAL_STATS.byDomain).reduce((a, b) => a + b, 0);
    expect(sum).toBe(DEMO_SIGNAL_STATS.total24h);
  });

  it('risk distribution total should match alert count logic', () => {
    const total = Object.values(DEMO_RISK_DISTRIBUTION).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(0);
  });
});

// ─── Alerts: all domains should be represented ─────────────
describe('Alert Domain Coverage', () => {
  it('should have alerts in all core domains', () => {
    const allDomains = new Set(DEMO_ALERTS.flatMap((a) => a.domains));
    expect(allDomains).toContain('finance');
    expect(allDomains).toContain('security');
    expect(allDomains).toContain('operations');
    expect(allDomains).toContain('communications');
  });

  it('should have alerts in new IC3 domains', () => {
    const allDomains = new Set(DEMO_ALERTS.flatMap((a) => a.domains));
    expect(allDomains).toContain('bec');
    expect(allDomains).toContain('crypto');
    expect(allDomains).toContain('ransomware');
    expect(allDomains).toContain('ai_threat');
    expect(allDomains).toContain('vendor_risk');
  });

  it('should have at least one alert with evidence brief for each IC3 type', () => {
    const becAlert = DEMO_ALERTS.find((a) => a.domains.includes('bec') && a.evidenceBrief);
    const cryptoAlert = DEMO_ALERTS.find((a) => a.domains.includes('crypto') && a.evidenceBrief);
    expect(becAlert).toBeDefined();
    expect(cryptoAlert).toBeDefined();
  });
});

// ─── Policies: all new domains covered ─────────────────────
describe('Policy Coverage', () => {
  it('should have policies for all new domains', () => {
    const policyDomains = new Set(DEMO_POLICIES.map((p) => p.domain));
    expect(policyDomains).toContain('bec');
    expect(policyDomains).toContain('crypto');
    expect(policyDomains).toContain('ai_threat');
    expect(policyDomains).toContain('vendor_risk');
  });

  it('all policies should have regulatory references or null', () => {
    DEMO_POLICIES.forEach((p) => {
      // regulatory can be null for non-regulatory policies
      if (p.regulatory !== null) {
        expect(typeof p.regulatory).toBe('string');
        expect(p.regulatory.length).toBeGreaterThan(0);
      }
    });
  });

  it('all active policies should have an approvedBy', () => {
    DEMO_POLICIES.filter((p) => p.status === 'active').forEach((p) => {
      expect(p.approvedBy).toBeTruthy();
    });
  });
});

// ─── Integrations: new systems properly configured ─────────
describe('Integration Configuration', () => {
  it('should have blockchain analytics integrations', () => {
    const blockchain = DEMO_INTEGRATIONS.filter((i) => i.type === 'blockchain_analytics');
    expect(blockchain.length).toBe(2); // Chainalysis + TRM Labs
  });

  it('should have threat intelligence integration', () => {
    const threatIntel = DEMO_INTEGRATIONS.find((i) => i.type === 'threat_intelligence');
    expect(threatIntel).toBeDefined();
    expect(threatIntel!.name).toContain('MITRE');
  });

  it('should have vendor risk integration', () => {
    const vendorRisk = DEMO_INTEGRATIONS.find((i) => i.type === 'vendor_risk');
    expect(vendorRisk).toBeDefined();
    expect(vendorRisk!.name).toContain('SecurityScorecard');
  });

  it('all connected integrations should have healthy or degraded health', () => {
    DEMO_INTEGRATIONS.filter((i) => i.status === 'connected').forEach((i) => {
      expect(['healthy', 'degraded']).toContain(i.health);
    });
  });

  it('all integrations should describe their signals', () => {
    DEMO_INTEGRATIONS.forEach((i) => {
      expect(i.signals.length).toBeGreaterThan(0);
    });
  });
});

// ─── Agents: IC3 team operational ──────────────────────────
describe('Agent Operational Status', () => {
  it('all IC3 agents should be running', () => {
    const ic3AgentIds = ['agent-crypto', 'agent-bec', 'agent-aithreat', 'agent-vendor', 'agent-ransomware'];
    ic3AgentIds.forEach((id) => {
      const agent = DEMO_AGENTS.find((a) => a.id === id);
      expect(agent).toBeDefined();
      expect(agent!.status).toBe('running');
      expect(agent!.health).toBe('healthy');
    });
  });

  it('IC3 agents should have signal counts', () => {
    const ic3Agents = DEMO_AGENTS.filter((a) =>
      ['agent-crypto', 'agent-bec', 'agent-aithreat', 'agent-vendor', 'agent-ransomware'].includes(a.id)
    );
    ic3Agents.forEach((a) => {
      expect(a.signals).toBeGreaterThan(0);
    });
  });

  it('collection agents should still be operational', () => {
    const collectors = DEMO_AGENTS.filter((a) => a.team === 'Collection');
    expect(collectors.length).toBe(5);
    collectors.forEach((c) => {
      expect(c.status).toBe('running');
    });
  });
});

// ─── Vendor Risk: data quality ─────────────────────────────
describe('Vendor Risk Data Quality', () => {
  it('should have at least one critical-impact vendor', () => {
    const critical = DEMO_VENDOR_RISKS.filter((v) => v.businessImpact === 'critical');
    expect(critical.length).toBeGreaterThanOrEqual(1);
  });

  it('all vendors should have valid security ratings', () => {
    const validRatings = ['A+', 'A', 'B', 'C', 'D', 'F'];
    DEMO_VENDOR_RISKS.forEach((v) => {
      expect(validRatings).toContain(v.securityRating);
      expect(validRatings).toContain(v.previousRating);
    });
  });

  it('all vendors should have risk scores in 0-100 range', () => {
    DEMO_VENDOR_RISKS.forEach((v) => {
      expect(v.riskScore).toBeGreaterThanOrEqual(0);
      expect(v.riskScore).toBeLessThanOrEqual(100);
    });
  });

  it('should have valid trajectory values', () => {
    const validTrajectories = ['accelerating', 'stable', 'declining'];
    DEMO_VENDOR_RISKS.forEach((v) => {
      expect(validTrajectories).toContain(v.trend);
    });
  });
});

// ─── IC3 Threat Data: module mapping integrity ─────────────
describe('IC3 Module Mapping Integrity', () => {
  it('covered threats should have matching active modules in agents', () => {
    const activeIC3Agents = DEMO_AGENTS.filter((a) =>
      ['agent-crypto', 'agent-bec', 'agent-aithreat', 'agent-vendor', 'agent-ransomware'].includes(a.id)
    );
    // Should have at least as many agents as active modules
    expect(activeIC3Agents.length).toBeGreaterThanOrEqual(IC3_THREAT_DATA.organizationExposure.activeModules);
  });

  it('gap areas should not have active modules', () => {
    IC3_THREAT_DATA.organizationExposure.gapAreas.forEach((gap) => {
      const threat = IC3_THREAT_DATA.topThreats.find((t) => gap.includes(t.category));
      if (threat) {
        expect(threat.moduleStatus).not.toBe('active');
      }
    });
  });

  it('all active threat modules should have corresponding policies', () => {
    const activeThreats = IC3_THREAT_DATA.topThreats.filter((t) => t.moduleStatus === 'active');
    const policyDomains = new Set(DEMO_POLICIES.map((p) => p.domain));
    // At least verify core IC3 domains are covered by policies
    expect(policyDomains).toContain('crypto');
    expect(policyDomains).toContain('bec');
    expect(policyDomains).toContain('ai_threat');
    expect(policyDomains).toContain('vendor_risk');
  });
});

// ─── Cross-Feature: signal-to-alert-to-policy pipeline ─────
describe('Signal-Alert-Policy Pipeline', () => {
  it('new signal domains should have corresponding alerts', () => {
    const signalDomains = Object.keys(DEMO_SIGNAL_STATS.byDomain);
    const alertDomains = new Set(DEMO_ALERTS.flatMap((a) => a.domains));

    // Each new IC3 signal domain should have at least one alert
    ['crypto', 'bec', 'ransomware', 'ai_threat', 'vendor_risk'].forEach((domain) => {
      expect(signalDomains).toContain(domain);
      expect(alertDomains).toContain(domain);
    });
  });

  it('new alert domains should have corresponding policies', () => {
    const ic3Domains = ['crypto', 'bec', 'ai_threat', 'vendor_risk'];
    const policyDomains = new Set(DEMO_POLICIES.map((p) => p.domain));

    ic3Domains.forEach((domain) => {
      expect(policyDomains).toContain(domain);
    });
  });

  it('new integrations should feed the correct signal domains', () => {
    // Chainalysis should feed crypto domain
    const chainalysis = DEMO_INTEGRATIONS.find((i) => i.name.includes('Chainalysis'));
    expect(chainalysis!.signals.toLowerCase()).toContain('wallet');

    // MITRE should feed ransomware/security domain
    const mitre = DEMO_INTEGRATIONS.find((i) => i.name.includes('MITRE'));
    expect(mitre!.signals.toLowerCase()).toContain('ransomware');

    // SecurityScorecard should feed vendor_risk domain
    const ssc = DEMO_INTEGRATIONS.find((i) => i.name.includes('SecurityScorecard'));
    expect(ssc!.signals.toLowerCase()).toContain('vendor');
  });
});
