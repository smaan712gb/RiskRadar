import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256')
    .update(password + salt)
    .digest('hex');
  return `${salt}:${hash}`;
}

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script cannot run in production. Set NODE_ENV to development or test.');
    process.exit(1);
  }

  console.log('Seeding database...');

  // ─── TENANT: Teachers Federal Credit Union ────────────────
  const tfcu = await prisma.tenant.upsert({
    where: { slug: 'tfcu' },
    update: {},
    create: {
      name: 'Teachers Federal Credit Union',
      slug: 'tfcu',
      industry: 'credit_union',
      settings: {
        timezone: 'America/New_York',
        dataRetentionDays: 365,
        anonymizationLevel: 'partial',
        consentRequired: true,
        enabledDomains: ['hr', 'finance', 'security', 'operations', 'communications'],
        alertThresholds: {
          compoundScoreHigh: 75,
          compoundScoreMedium: 50,
          compoundScoreLow: 25,
        },
        notifications: {
          slackEnabled: false,
          teamsEnabled: true,
          emailEnabled: true,
          smsEnabled: false,
        },
        regulatoryFrameworks: ['BSA_AML', 'NCUA', 'GLBA', 'FCRA'],
      },
    },
  });

  console.log(`Created tenant: ${tfcu.name} (${tfcu.id})`);

  // ─── TENANT: Demo Community Bank (original) ───────────────
  const demoBank = await prisma.tenant.upsert({
    where: { slug: 'demo-bank' },
    update: {},
    create: {
      name: 'Demo Community Bank',
      slug: 'demo-bank',
      industry: 'banking',
      settings: {
        timezone: 'America/New_York',
        dataRetentionDays: 365,
        anonymizationLevel: 'partial',
        consentRequired: true,
        enabledDomains: ['hr', 'finance', 'security', 'operations', 'communications'],
        alertThresholds: {
          compoundScoreHigh: 75,
          compoundScoreMedium: 50,
          compoundScoreLow: 25,
        },
        notifications: {
          slackEnabled: false,
          teamsEnabled: false,
          emailEnabled: true,
          smsEnabled: false,
        },
        regulatoryFrameworks: ['BSA_AML', 'SOX', 'GLBA'],
      },
    },
  });

  // ─── ROLES (for both tenants) ─────────────────────────────
  const roleDefinitions = [
    { name: 'admin', description: 'Full system access', isSystem: true },
    { name: 'compliance_officer', description: 'Compliance and regulatory oversight', isSystem: true },
    { name: 'ciso', description: 'Security leadership', isSystem: true },
    { name: 'analyst', description: 'Alert review and investigation', isSystem: true },
    { name: 'manager', description: 'Team oversight and escalation review', isSystem: true },
    { name: 'auditor', description: 'Read-only audit access', isSystem: true },
    { name: 'regulator', description: 'Read-only regulatory examination access', isSystem: true },
  ];

  for (const tenant of [tfcu, demoBank]) {
    for (const role of roleDefinitions) {
      await prisma.role.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: role.name } },
        update: {},
        create: {
          tenantId: tenant.id,
          name: role.name,
          description: role.description,
          isSystem: role.isSystem,
          permissions: [],
        },
      });
    }
  }

  console.log(`Created ${roleDefinitions.length} system roles for each tenant`);

  // ─── TFCU USERS ───────────────────────────────────────────
  const tfcuUsers = [
    { email: 'admin@tfcu.org', name: 'Maria Gonzalez', role: 'admin', title: 'VP of Risk & Compliance' },
    { email: 'compliance@tfcu.org', name: 'David Chen', role: 'compliance_officer', title: 'Chief Compliance Officer' },
    { email: 'ciso@tfcu.org', name: 'Raj Patel', role: 'ciso', title: 'CISO' },
    { email: 'sarah.kim@tfcu.org', name: 'Sarah Kim', role: 'analyst', title: 'Senior Risk Analyst' },
    { email: 'james.wright@tfcu.org', name: 'James Wright', role: 'analyst', title: 'BSA/AML Analyst' },
    { email: 'linda.thompson@tfcu.org', name: 'Linda Thompson', role: 'manager', title: 'Branch Ops Manager' },
    { email: 'auditor@tfcu.org', name: 'Robert Martinez', role: 'auditor', title: 'Internal Auditor' },
  ];

  const defaultPw = await hashPassword('riskradar2026!');
  const createdUsers: Record<string, string> = {};

  for (const u of tfcuUsers) {
    const user = await prisma.user.upsert({
      where: { tenantId_email: { tenantId: tfcu.id, email: u.email } },
      update: {},
      create: {
        tenantId: tfcu.id,
        email: u.email,
        name: u.name,
        passwordHash: defaultPw,
        role: u.role,
        permissions: [],
        isActive: true,
      },
    });
    createdUsers[u.email] = user.id;
  }

  console.log(`Created ${tfcuUsers.length} TFCU users`);

  // ─── DEMO BANK USERS (original) ──────────────────────────
  const adminPassword = await hashPassword('admin123!');
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoBank.id, email: 'admin@riskradar.dev' } },
    update: {},
    create: {
      tenantId: demoBank.id,
      email: 'admin@riskradar.dev',
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'admin',
      permissions: [],
      isActive: true,
    },
  });

  const analystPassword = await hashPassword('analyst123!');
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: demoBank.id, email: 'analyst@riskradar.dev' } },
    update: {},
    create: {
      tenantId: demoBank.id,
      email: 'analyst@riskradar.dev',
      name: 'Jane Analyst',
      passwordHash: analystPassword,
      role: 'analyst',
      permissions: [],
      isActive: true,
    },
  });

  // ─── TFCU SIGNALS ─────────────────────────────────────────
  const now = new Date();
  const signalBatch = [
    { domain: 'finance', signalType: 'override_transaction', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'Symitar Core Banking', value: 85000, metadata: { transactionId: 'WR-78291', type: 'wire_transfer', overrideReason: 'manager_absent' } },
    { domain: 'finance', signalType: 'override_transaction', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'Symitar Core Banking', value: 92000, metadata: { transactionId: 'WR-78292', type: 'wire_transfer', overrideReason: 'manager_absent' } },
    { domain: 'finance', signalType: 'override_transaction', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'Symitar Core Banking', value: 78000, metadata: { transactionId: 'WR-78295', type: 'wire_transfer', overrideReason: 'manager_absent' } },
    { domain: 'finance', signalType: 'new_payee', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'Symitar Core Banking', value: null, metadata: { beneficiaryId: 'BEN-A1104', createdAt: '2026-03-28T09:15:00Z' } },
    { domain: 'security', signalType: 'after_hours_access', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'Azure AD Audit', value: 12, metadata: { profilesAccessed: 12, timeOfAccess: '22:14', normalHours: '08:30-17:00' } },
    { domain: 'hr', signalType: 'leave_pattern_change', subjectType: 'employee', subjectId: 'MSR-4821-MGR', sourceSystem: 'UKG HRIS', value: null, metadata: { type: 'supervisor_pto', startDate: '2026-03-27', endDate: '2026-03-31' } },
    { domain: 'hr', signalType: 'training_missed', subjectType: 'employee', subjectId: 'MSR-4821', sourceSystem: 'UKG Learning', value: null, metadata: { course: 'Annual BSA/AML Refresher', dueDate: '2026-03-15' } },
    { domain: 'security', signalType: 'data_export', subjectType: 'employee', subjectId: 'IT-1102', sourceSystem: 'Splunk SIEM', value: 2.1, metadata: { dataSize: '2.1GB', timeOfAccess: '23:42', database: 'member_prod' } },
    { domain: 'finance', signalType: 'sub_ctr_clustering', subjectType: 'department', subjectId: 'BRANCH-FV', sourceSystem: 'Symitar Core Banking', value: 9750, metadata: { count: 14, avgAmount: 9750, daySpan: 3, tellerCount: 4 } },
    { domain: 'security', signalType: 'geo_anomaly', subjectType: 'service_account', subjectId: 'SVCACCT-CORE', sourceSystem: 'Azure AD', value: null, metadata: { locations: ['New York', 'Lagos', 'Singapore'], timeWindow: '15min' } },
    { domain: 'finance', signalType: 'benford_deviation', subjectType: 'employee', subjectId: 'VP-2156', sourceSystem: 'Workday Financials', value: 2.3, metadata: { category: 'travel_expenses', stdDeviation: 2.3, sampleSize: 47 } },
    { domain: 'communications', signalType: 'sentiment_spike', subjectType: 'system', subjectId: 'SYS-OLB', sourceSystem: 'Salesforce CRM', value: 340, metadata: { percentIncrease: 340, topic: 'online_banking', channel: 'phone_complaints' } },
    // IC3 2025: BEC signals
    { domain: 'bec', signalType: 'writing_style_deviation', subjectType: 'external_threat', subjectId: 'BEC-EXT-0041', sourceSystem: 'Microsoft 365 Email Analytics', value: 94, metadata: { deviationPercent: 94, baselineMonths: 18, senderAccount: 'cfo@tfcu.org' } },
    { domain: 'bec', signalType: 'vendor_payment_change', subjectType: 'vendor', subjectId: 'VND-ACME', sourceSystem: 'Workday Financials', value: null, metadata: { vendorName: 'Acme Corp', changeType: 'bank_details', previousBank: 'Chase', newBank: 'Unknown offshore' } },
    { domain: 'bec', signalType: 'unfamiliar_device_auth', subjectType: 'external_threat', subjectId: 'BEC-EXT-0041', sourceSystem: 'Azure AD', value: null, metadata: { ip: '185.xx.xx.42', geo: 'Kyiv, Ukraine', knownDevices: 3 } },
    // IC3 2025: Crypto fraud signals
    { domain: 'crypto', signalType: 'crypto_transfer_escalation', subjectType: 'member', subjectId: 'MBR-9923', sourceSystem: 'Symitar + Chainalysis', value: 120000, metadata: { transfers: [2000, 5000, 15000, 45000, 120000], weeks: 6, wallet: '0x7a3f...' } },
    { domain: 'crypto', signalType: 'high_risk_wallet', subjectType: 'member', subjectId: 'MBR-9923', sourceSystem: 'Chainalysis KYT', value: 91, metadata: { walletAddress: '0x7a3f...', riskScore: 91, category: 'romance_scam_ring', region: 'Southeast Asia' } },
    { domain: 'crypto', signalType: 'rapid_asset_depletion', subjectType: 'member', subjectId: 'MBR-9923', sourceSystem: 'Symitar Core Banking', value: 188000, metadata: { previousBalance: 340000, currentBalance: 152000, depletionWeeks: 6 } },
    // IC3 2025: Ransomware signals
    { domain: 'security', signalType: 'cve_exploit_match', subjectType: 'infrastructure', subjectId: 'INFRA-SURFACE', sourceSystem: 'MITRE ATT&CK Feed', value: 3, metadata: { cves: ['CVE-2026-1234', 'CVE-2026-5678', 'CVE-2025-9012'], ransomwareGroup: 'LockBit 4.0' } },
    { domain: 'security', signalType: 'exposed_rdp_service', subjectType: 'infrastructure', subjectId: 'SRV-BRANCH-02', sourceSystem: 'Attack Surface Scan', value: null, metadata: { port: 3389, location: 'Farmingville Branch', exposed: true } },
    // IC3 2025: AI threat signals
    { domain: 'ai_threat', signalType: 'ai_phishing_detected', subjectType: 'external_threat', subjectId: 'AI-PHISH-CAMP-0012', sourceSystem: 'AI Threat Intel', value: 47, metadata: { emailCount: 47, detectionMethod: 'linguistic_fingerprint', targetedStaff: 23, period: '72h' } },
  ];

  for (const signal of signalBatch) {
    await prisma.signal.create({
      data: {
        tenantId: tfcu.id,
        domain: signal.domain,
        signalType: signal.signalType,
        subjectType: signal.subjectType,
        subjectId: signal.subjectId,
        sourceSystem: signal.sourceSystem,
        value: signal.value,
        metadata: signal.metadata,
        timestamp: new Date(now.getTime() - Math.random() * 48 * 3600 * 1000),
      },
    });
  }

  console.log(`Created ${signalBatch.length} TFCU signals`);

  // ─── TFCU ALERTS ──────────────────────────────────────────
  const analystId = createdUsers['sarah.kim@tfcu.org']!;
  const cisoId = createdUsers['ciso@tfcu.org']!;

  const alert1 = await prisma.alert.create({
    data: {
      tenantId: tfcu.id,
      title: 'Compound Risk: Member Services + Finance — Score 89',
      description: 'Cross-domain risk pattern: MSR-4821 processed 7 override transactions totaling $340K during supervisor PTO.',
      alertType: 'compound_risk',
      severity: 'critical',
      status: 'new',
      compoundScore: 89,
      confidenceScore: 91,
      falsePositiveLikelihood: 'low',
      domains: ['finance', 'security', 'operations'],
      subjectType: 'employee',
      subjectId: 'MSR-4821',
      assignedTo: analystId,
      modelVersion: 'v2026.3',
      reasoningModelUsed: 'tier2_cascade',
      processingTimeMs: 4200,
      evidenceBrief: {
        summary: 'MSR-4821 processed 7 wire transfer overrides totaling $340K during supervisor PTO with after-hours CRM access.',
        evidenceChain: [
          { sequence: 1, timestamp: '2026-03-28T14:23:00Z', description: '4 wire transfers >$25K each with manager override', sourceSystem: 'Symitar Core Banking', sourceId: 'WR-78291,78292,78295,78296', signalType: 'override_transaction', significance: 'Override volume 7x monthly baseline' },
          { sequence: 2, timestamp: '2026-03-27T00:00:00Z', description: 'Supervisor on PTO Mar 27-31', sourceSystem: 'UKG HRIS', sourceId: 'PTO-2847', signalType: 'leave_pattern_change', significance: 'Override clustering correlates with supervisor absence' },
        ],
      },
      regulatoryMapping: [
        { regulation: 'BSA/AML', section: 'FinCEN Advisory 2025-A003', description: 'Insider threat red flags', relevance: 'direct' },
        { regulation: 'NCUA', section: 'Letter 26-CU-03', description: 'Credit union insider threat controls', relevance: 'direct' },
      ],
    },
  });

  await prisma.alert.create({
    data: {
      tenantId: tfcu.id,
      title: 'Data Exfiltration Risk: IT Admin After-Hours Access',
      description: 'IT administrator exported 2.1GB of member data at 11:42 PM.',
      alertType: 'anomaly',
      severity: 'high',
      status: 'under_review',
      compoundScore: 76,
      confidenceScore: 82,
      falsePositiveLikelihood: 'medium',
      domains: ['security', 'operations'],
      subjectType: 'employee',
      subjectId: 'IT-1102',
      assignedTo: cisoId,
      modelVersion: 'v2026.3',
      reasoningModelUsed: 'tier1_super',
      processingTimeMs: 1800,
      regulatoryMapping: [],
    },
  });

  await prisma.alert.create({
    data: {
      tenantId: tfcu.id,
      title: 'Privileged Access Anomaly: Service Account Credential Sharing',
      description: 'Service account SVCACCT-CORE logged in from 3 geographic locations within 15 minutes.',
      alertType: 'anomaly',
      severity: 'critical',
      status: 'under_review',
      compoundScore: 83,
      confidenceScore: 95,
      falsePositiveLikelihood: 'low',
      domains: ['security'],
      subjectType: 'service_account',
      subjectId: 'SVCACCT-CORE',
      assignedTo: cisoId,
      modelVersion: 'v2026.3',
      reasoningModelUsed: 'tier1_super',
      processingTimeMs: 900,
      regulatoryMapping: [],
    },
  });

  // IC3 2025: BEC Alert
  await prisma.alert.create({
    data: {
      tenantId: tfcu.id,
      title: 'BEC Attack: CFO Wire Request — Writing Style Deviation Detected',
      description: 'Email from CFO account requesting $285K wire shows 94% writing style deviation. Sent from unfamiliar device in Eastern Europe.',
      alertType: 'compound_risk',
      severity: 'critical',
      status: 'new',
      compoundScore: 92,
      confidenceScore: 96,
      falsePositiveLikelihood: 'low',
      domains: ['bec', 'finance', 'security'],
      subjectType: 'external_threat',
      subjectId: 'BEC-EXT-0041',
      assignedTo: analystId,
      modelVersion: 'v2026.3',
      reasoningModelUsed: 'tier2_cascade',
      processingTimeMs: 3100,
      regulatoryMapping: [
        { regulation: 'FBI IC3', section: 'BEC Advisory 2025', description: 'BEC — second costliest cybercrime at $3B+', relevance: 'direct' },
      ],
    },
  });

  // IC3 2025: Crypto Fraud Alert
  await prisma.alert.create({
    data: {
      tenantId: tfcu.id,
      title: 'Crypto Fraud: Pig Butchering Pattern — Member MBR-9923',
      description: 'Escalating crypto transfers ($2K→$120K over 6 weeks) to wallet flagged by Chainalysis as romance scam ring.',
      alertType: 'pattern',
      severity: 'high',
      status: 'new',
      compoundScore: 81,
      confidenceScore: 89,
      falsePositiveLikelihood: 'low',
      domains: ['crypto', 'finance'],
      subjectType: 'member_account',
      subjectId: 'MBR-9923',
      assignedTo: analystId,
      modelVersion: 'v2026.3',
      reasoningModelUsed: 'tier1_super',
      processingTimeMs: 2800,
      regulatoryMapping: [
        { regulation: 'FinCEN', section: '2025-G001', description: 'Virtual asset transaction monitoring', relevance: 'direct' },
        { regulation: 'FBI IC3', section: 'Investment Fraud 2025', description: 'Investment fraud — $8.6B losses', relevance: 'direct' },
      ],
    },
  });

  console.log('Created 5 TFCU alerts (including 2 IC3 2025 alerts)');

  // ─── TFCU CASES ───────────────────────────────────────────
  await prisma.case.create({
    data: {
      tenantId: tfcu.id,
      title: 'Insider Transaction Fraud — Hauppauge Branch',
      description: 'Investigation into potential insider-facilitated wire fraud by MSR-4821.',
      status: 'investigating',
      priority: 'critical',
      subjectType: 'employee',
      subjectId: 'MSR-4821',
      assignedTo: analystId,
      createdBy: analystId,
      slaDeadline: new Date(now.getTime() + 10 * 24 * 3600 * 1000),
      tags: ['insider_threat', 'wire_fraud', 'bsa_aml'],
      alerts: { connect: [{ id: alert1.id }] },
    },
  });

  console.log('Created 1 TFCU case');

  // ─── TFCU RISK SCORES ────────────────────────────────────
  const riskScores = [
    { subjectType: 'employee', subjectId: 'MSR-4821', overallScore: 89, trajectory: 'accelerating', domainScores: { finance: 92, security: 71, operations: 68 } },
    { subjectType: 'employee', subjectId: 'IT-1102', overallScore: 76, trajectory: 'accelerating', domainScores: { security: 85, operations: 62 } },
    { subjectType: 'service_account', subjectId: 'SVCACCT-CORE', overallScore: 83, trajectory: 'accelerating', domainScores: { security: 95 } },
    { subjectType: 'department', subjectId: 'BRANCH-FV', overallScore: 71, trajectory: 'stable', domainScores: { finance: 71, compliance: 65 } },
    { subjectType: 'employee', subjectId: 'LO-3847', overallScore: 56, trajectory: 'accelerating', domainScores: { finance: 62, hr: 58 } },
    { subjectType: 'employee', subjectId: 'VP-2156', overallScore: 48, trajectory: 'stable', domainScores: { finance: 48, hr: 32 } },
  ];

  for (const rs of riskScores) {
    await prisma.riskScore.create({
      data: {
        tenantId: tfcu.id,
        subjectType: rs.subjectType,
        subjectId: rs.subjectId,
        overallScore: rs.overallScore,
        domainScores: rs.domainScores,
        trajectory: rs.trajectory,
        modelVersion: 'v2026.3',
      },
    });
  }

  console.log(`Created ${riskScores.length} TFCU risk scores`);

  // ─── TFCU POLICIES ────────────────────────────────────────
  const adminId = createdUsers['admin@tfcu.org']!;
  const ccoId = createdUsers['compliance@tfcu.org']!;

  const policyDefs = [
    { name: 'Wire Transfer Override Monitoring', domain: 'finance', policyType: 'threshold', regulatoryRef: 'BSA/AML — 31 CFR 1020', approvedBy: ccoId },
    { name: 'After-Hours System Access Detection', domain: 'security', policyType: 'behavioral', regulatoryRef: 'GLBA — Reg P', approvedBy: cisoId },
    { name: 'CTR Structuring Detection', domain: 'finance', policyType: 'pattern', regulatoryRef: 'BSA/AML — 31 CFR 1010.311', approvedBy: ccoId },
    { name: 'Privileged Account Monitoring', domain: 'security', policyType: 'threshold', regulatoryRef: 'NCUA — Part 748', approvedBy: cisoId },
    { name: 'Member Complaint Sentiment Analysis', domain: 'communications', policyType: 'trend', regulatoryRef: 'CFPB — UDAAP', approvedBy: adminId },
  ];

  // IC3 2025 Enhancement Policies
  const ic3PolicyDefs = [
    { name: 'BEC Email Behavior Analytics', domain: 'bec', policyType: 'behavioral', regulatoryRef: 'FBI IC3 — BEC Advisory 2025', approvedBy: ccoId },
    { name: 'Vendor Payment Impersonation Detection', domain: 'bec', policyType: 'pattern', regulatoryRef: 'SOX 404 / FBI IC3', approvedBy: ccoId },
    { name: 'Cryptocurrency Transaction Monitoring', domain: 'crypto', policyType: 'anomaly', regulatoryRef: 'FinCEN — Travel Rule / BSA', approvedBy: ccoId },
    { name: 'Crypto Wallet Risk Scoring', domain: 'crypto', policyType: 'threshold', regulatoryRef: 'FinCEN 2025-G001 / OFAC SDN', approvedBy: ccoId },
    { name: 'Ransomware Exposure Assessment', domain: 'security', policyType: 'anomaly', regulatoryRef: 'NIST CSF 2.0 / CISA KEV', approvedBy: cisoId },
    { name: 'AI-Generated Phishing Detection', domain: 'ai_threat', policyType: 'behavioral', regulatoryRef: 'FBI IC3 — AI Threat Advisory 2025', approvedBy: cisoId },
    { name: 'Supply Chain Vendor Risk Monitoring', domain: 'vendor_risk', policyType: 'trend', regulatoryRef: 'NIST SP 800-161r1', approvedBy: cisoId },
  ];

  const allPolicyDefs = [...policyDefs, ...ic3PolicyDefs];

  for (const p of allPolicyDefs) {
    await prisma.policy.create({
      data: {
        tenantId: tfcu.id,
        name: p.name,
        description: `Automated monitoring policy for ${p.domain} domain.`,
        policyType: p.policyType,
        domain: p.domain,
        rules: { thresholds: [], conditions: [] },
        isActive: true,
        regulatoryRef: p.regulatoryRef,
        createdBy: adminId,
        approvedBy: p.approvedBy,
        approvedAt: new Date(),
      },
    });
  }

  console.log(`Created ${allPolicyDefs.length} TFCU policies (including ${ic3PolicyDefs.length} IC3 2025 policies)`);

  // ─── REGULATORY RULES ────────────────────────────────────
  const regulatoryRules = [
    {
      framework: 'BSA_AML',
      section: '31_CFR_1020.320',
      title: 'SAR Filing Requirements',
      description: 'Financial institutions must file SARs for transactions involving $5,000+ that the institution knows or suspects involve funds from illegal activity.',
      requirements: { thresholds: { amount: 5000, currency: 'USD' }, filingDeadline: '30 calendar days from detection', retentionPeriod: '5 years' },
      signalMappings: ['override_transaction', 'unusual_amount', 'new_payee'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: 'FinCEN_2025_A003',
      title: 'Insider Threat Red Flag Indicators',
      description: 'Indicators of potential insider facilitation of financial crime.',
      requirements: { indicators: ['Override clustering during supervisor absence', 'After-hours system access with transaction activity', 'New payee accounts created proximate to large transfers'] },
      signalMappings: ['override_transaction', 'after_hours_access', 'new_payee', 'approval_bypass'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'NCUA',
      section: 'Letter_26_CU_03',
      title: 'Credit Union Insider Threat Controls',
      description: 'NCUA guidance on monitoring and preventing insider threats at federally insured credit unions.',
      requirements: { controls: ['Supervisor override monitoring', 'Dual control for wire transfers', 'Separation of duties'] },
      signalMappings: ['override_transaction', 'dual_control_bypass', 'separation_of_duties_violation'],
      industries: ['credit_union'],
      jurisdictions: ['US'],
    },
  ];

  // ─── IC3 2025 Regulatory Rules ───────────────────────────
  const ic3RegulatoryRules = [
    {
      framework: 'FBI_IC3',
      section: 'BEC_Advisory_2025',
      title: 'Business Email Compromise Defense',
      description: 'FBI IC3 2025 identifies BEC as the second-costliest cybercrime at $3B+ in losses. Organizations must implement email behavior analytics, vendor impersonation detection, and payment verification workflows.',
      requirements: { controls: ['Email writing style analysis', 'Vendor payment change verification', 'Out-of-band wire transfer confirmation', 'Device fingerprint monitoring'] },
      signalMappings: ['writing_style_deviation', 'vendor_payment_change', 'unfamiliar_device_auth', 'urgency_pressure'],
      industries: ['banking', 'credit_union', 'financial_services'],
      jurisdictions: ['US'],
    },
    {
      framework: 'FinCEN',
      section: '2025_G001_Crypto',
      title: 'Virtual Asset Transaction Monitoring',
      description: 'FinCEN guidance on monitoring crypto transactions for fraud patterns including pig butchering, mixer usage, and sanctioned entity transfers.',
      requirements: { controls: ['Wallet risk scoring', 'Transaction escalation monitoring', 'Sanctions screening', 'Mixer detection'], thresholds: { reportingAmount: 10000, currency: 'USD' } },
      signalMappings: ['crypto_transfer_escalation', 'high_risk_wallet', 'rapid_asset_depletion', 'sanctions_match'],
      industries: ['banking', 'credit_union', 'crypto_exchange', 'fintech'],
      jurisdictions: ['US'],
    },
    {
      framework: 'NIST',
      section: 'CSF_2_0_Ransomware',
      title: 'Ransomware Risk Management',
      description: 'NIST CSF 2.0 guidance on ransomware exposure assessment including attack surface monitoring, MITRE ATT&CK TTP mapping, and supply chain risk.',
      requirements: { controls: ['Attack surface monitoring', 'CVE-to-ransomware mapping', 'Dark web intelligence', 'Vendor risk assessment', 'MITRE ATT&CK alignment'] },
      signalMappings: ['cve_exploit_match', 'exposed_rdp_service', 'vendor_rating_change', 'credential_leak_detected'],
      industries: ['banking', 'credit_union', 'healthcare', 'critical_infrastructure'],
      jurisdictions: ['US'],
    },
    {
      framework: 'FBI_IC3',
      section: 'AI_Threat_Advisory_2025',
      title: 'AI-Enabled Cybercrime Detection',
      description: 'First-ever FBI IC3 section on AI-enabled cybercrime. 22,364 complaints and $893M in losses from AI-generated phishing, voice cloning, and synthetic media attacks.',
      requirements: { controls: ['AI-generated content detection', 'Phishing template fingerprinting', 'Voice cloning awareness', 'OSINT AI threat feeds'] },
      signalMappings: ['ai_phishing_detected', 'deepfake_tool_detected', 'synthetic_content_flagged'],
      industries: ['banking', 'credit_union', 'financial_services', 'healthcare'],
      jurisdictions: ['US'],
    },
  ];

  const allRules = [...regulatoryRules, ...ic3RegulatoryRules];

  for (const rule of allRules) {
    await prisma.regulatoryRule.create({ data: rule });
  }

  console.log(`Created ${allRules.length} regulatory rules (including ${ic3RegulatoryRules.length} IC3 2025 rules)`);

  // ─── TFCU AUDIT LOGS ─────────────────────────────────────
  const auditEntries = [
    { actorType: 'agent', actorId: analystId, action: 'alert.created', resource: 'alert', resourceId: alert1.id, details: { source: 'Fusion Engine', score: 89 } },
    { actorType: 'user', actorId: analystId, action: 'alert.viewed', resource: 'alert', resourceId: alert1.id, details: { viewer: 'Sarah Kim' } },
    { actorType: 'agent', actorId: analystId, action: 'sar.draft_created', resource: 'sar_draft', resourceId: 'SAR-2026-001', details: { caseRef: 'CSE-2026-001', deadline: '2026-04-27' } },
  ];

  for (const entry of auditEntries) {
    await prisma.auditLog.create({
      data: {
        tenantId: tfcu.id,
        ...entry,
        timestamp: new Date(now.getTime() - Math.random() * 8 * 3600 * 1000),
      },
    });
  }

  console.log(`Created ${auditEntries.length} TFCU audit log entries`);
  console.log('\nSeed completed successfully.');
  console.log('\n=== TFCU Demo Credentials ===');
  console.log('Organization: tfcu');
  console.log('Password (all users): riskradar2026!');
  console.log('Users:');
  tfcuUsers.forEach((u) => console.log(`  ${u.email} — ${u.name} (${u.role})`));
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
