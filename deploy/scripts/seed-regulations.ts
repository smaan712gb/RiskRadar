import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding comprehensive regulatory rules...');

  // Clear existing rules to reseed cleanly
  await prisma.regulatoryRule.deleteMany({});
  console.log('Cleared existing rules.');

  const rules = [
    // ════════════════════════════════════════════════════════
    // BSA/AML — Bank Secrecy Act / Anti-Money Laundering
    // ════════════════════════════════════════════════════════
    {
      framework: 'BSA_AML',
      section: '31_CFR_1020.320',
      title: 'SAR Filing Requirements',
      description: 'Financial institutions must file Suspicious Activity Reports for transactions involving $5,000 or more that the institution knows, suspects, or has reason to suspect involve funds derived from illegal activity, are designed to evade reporting requirements, or have no business or lawful purpose.',
      requirements: {
        thresholds: { sarAmount: 5000, ctrAmount: 10000, currency: 'USD' },
        filingDeadline: '30 calendar days from initial detection',
        retentionPeriod: '5 years from filing date',
        filingMethod: 'BSA E-Filing System',
        requiredFields: ['subject_information', 'suspicious_activity_description', 'timeline', 'supporting_documentation'],
      },
      signalMappings: ['override_transaction', 'unusual_amount', 'new_payee', 'approval_bypass'],
      industries: ['banking', 'credit_union', 'insurance'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: '31_CFR_1010.311',
      title: 'Currency Transaction Report (CTR) Requirements',
      description: 'Financial institutions must file CTRs for each deposit, withdrawal, exchange of currency, or other payment or transfer involving currency of more than $10,000 in a single transaction or multiple transactions by or on behalf of the same person on the same business day.',
      requirements: {
        threshold: 10000,
        filingDeadline: '15 calendar days after transaction',
        aggregation: 'Same person, same business day',
        exemptions: 'Certain businesses may qualify for exemption via FinCEN Form 110',
      },
      signalMappings: ['unusual_amount', 'override_transaction'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: 'FinCEN_2025_A003',
      title: 'Insider Threat Red Flag Indicators',
      description: 'FinCEN advisory identifying behavioral indicators of potential insider facilitation of financial crime within financial institutions.',
      requirements: {
        indicators: [
          'Override clustering during supervisor absence',
          'After-hours system access coinciding with transaction activity',
          'New payee accounts created proximate to large transfers',
          'Pattern of transactions just below reporting thresholds (structuring)',
          'Unusual access to customer records outside normal job function',
          'Declining participation in compliance training',
          'Changes in communication patterns or peer interaction frequency',
        ],
        responseRequired: 'Enhanced monitoring, investigation, potential SAR filing',
      },
      signalMappings: ['override_transaction', 'after_hours_access', 'new_payee', 'approval_bypass', 'training_missed', 'communication_drop'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: 'FinCEN_CDD_Rule',
      title: 'Customer Due Diligence Requirements',
      description: 'Requires covered financial institutions to identify and verify beneficial owners of legal entity customers at account opening, understand the nature and purpose of customer relationships, and conduct ongoing monitoring.',
      requirements: {
        beneficialOwnershipThreshold: '25% ownership or significant control',
        verificationRequired: 'At account opening',
        ongoingMonitoring: 'Risk-based, periodic review',
        recordRetention: '5 years after account closure',
      },
      signalMappings: ['unusual_amount', 'new_payee'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: '31_CFR_1010.410',
      title: 'Recordkeeping for Funds Transfers',
      description: 'Financial institutions must retain records for funds transfers of $3,000 or more, including originator and beneficiary information.',
      requirements: {
        threshold: 3000,
        requiredRecords: ['originator_name', 'originator_account', 'beneficiary_name', 'beneficiary_account', 'amount', 'date', 'payment_instructions'],
        retentionPeriod: '5 years',
      },
      signalMappings: ['unusual_amount', 'new_payee', 'override_transaction'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },

    // ════════════════════════════════════════════════════════
    // SOX — Sarbanes-Oxley Act
    // ════════════════════════════════════════════════════════
    {
      framework: 'SOX',
      section: 'Section_302',
      title: 'Corporate Responsibility for Financial Reports',
      description: 'CEO and CFO must certify that financial reports are accurate and complete. They must certify that internal controls are effective and that any material changes have been disclosed.',
      requirements: {
        certificationFrequency: 'Quarterly (10-Q) and annually (10-K)',
        certifiers: ['CEO', 'CFO'],
        scope: 'Accuracy of financial statements, effectiveness of internal controls, disclosure of material changes',
        penalties: 'Up to $5M fine and 20 years imprisonment for willful violations',
      },
      signalMappings: ['approval_bypass', 'override_transaction', 'policy_violation'],
      industries: ['banking', 'insurance', 'technology', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'SOX',
      section: 'Section_404',
      title: 'Management Assessment of Internal Controls',
      description: 'Management must annually assess the effectiveness of internal control over financial reporting. External auditors must attest to and report on the assessment.',
      requirements: {
        assessmentFrequency: 'Annual',
        documentationRequired: ['Control objectives', 'Control activities', 'Risk assessment', 'Monitoring activities', 'Information and communication'],
        testingRequired: 'Both design effectiveness and operating effectiveness',
        reportingDeficiencies: 'Material weaknesses must be disclosed publicly',
      },
      signalMappings: ['approval_bypass', 'override_transaction', 'privilege_escalation', 'policy_violation'],
      industries: ['banking', 'insurance', 'technology', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'SOX',
      section: 'Section_802',
      title: 'Document Retention and Destruction',
      description: 'Knowingly destroying, altering, or concealing documents with intent to obstruct any federal investigation or bankruptcy proceeding is a criminal offense.',
      requirements: {
        retentionPeriod: 'Audit workpapers: 7 years minimum',
        prohibitedActions: ['Destruction of documents during investigation', 'Alteration of records', 'Concealment of evidence'],
        penalties: 'Up to 20 years imprisonment',
        monitoringRequired: 'Document retention policies must be enforced and auditable',
      },
      signalMappings: ['data_exfiltration', 'policy_violation', 'unusual_data_access'],
      industries: ['banking', 'insurance', 'technology', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'SOX',
      section: 'Section_409',
      title: 'Real-Time Disclosure',
      description: 'Issuers must disclose to the public on a rapid and current basis material changes in their financial condition or operations.',
      requirements: {
        disclosureTimeline: 'Rapid and current basis',
        triggeredBy: 'Material changes in financial condition or operations',
        method: 'Form 8-K filing with SEC',
      },
      signalMappings: ['budget_overrun', 'unusual_amount', 'policy_violation'],
      industries: ['banking', 'insurance', 'technology'],
      jurisdictions: ['US'],
    },

    // ════════════════════════════════════════════════════════
    // GLBA — Gramm-Leach-Bliley Act
    // ════════════════════════════════════════════════════════
    {
      framework: 'GLBA',
      section: 'Financial_Privacy_Rule',
      title: 'Financial Privacy Rule (Regulation S-P)',
      description: 'Financial institutions must provide customers with a privacy notice explaining what personal information is collected, how it is used, and how it is protected. Customers must have the right to opt out of information sharing with non-affiliated third parties.',
      requirements: {
        noticeRequired: 'At account opening and annually thereafter',
        contentRequired: ['Categories of information collected', 'Categories of information disclosed', 'Categories of third parties', 'Opt-out rights and methods'],
        optOutRight: 'Customers must be able to opt out of sharing with non-affiliates',
      },
      signalMappings: ['data_exfiltration', 'unusual_data_access', 'consent_withdrawal'],
      industries: ['banking', 'credit_union', 'insurance'],
      jurisdictions: ['US'],
    },
    {
      framework: 'GLBA',
      section: 'Safeguards_Rule',
      title: 'Safeguards Rule (16 CFR 314)',
      description: 'Financial institutions must develop, implement, and maintain a comprehensive information security program with administrative, technical, and physical safeguards to protect customer information.',
      requirements: {
        designatedCoordinator: 'Qualified individual responsible for the program',
        riskAssessment: 'Regular assessment of risks to customer information',
        safeguards: ['Access controls', 'Encryption', 'Multi-factor authentication', 'Activity monitoring', 'Incident response plan'],
        vendorOversight: 'Service providers must maintain appropriate safeguards',
        boardReporting: 'Annual written report to board of directors',
        incidentNotification: 'Notify FTC within 60 days for incidents affecting 500+ customers',
      },
      signalMappings: ['after_hours_access', 'data_exfiltration', 'privilege_escalation', 'mfa_bypass', 'failed_login_spike'],
      industries: ['banking', 'credit_union', 'insurance'],
      jurisdictions: ['US'],
    },
    {
      framework: 'GLBA',
      section: 'Pretexting_Protection',
      title: 'Pretexting Protection',
      description: 'Prohibits the use of false pretenses, including fraudulent statements and impersonation, to obtain customer financial information from financial institutions.',
      requirements: {
        prohibitedActivities: ['Social engineering attacks', 'Impersonation of customers', 'Fraudulent requests for account information'],
        monitoringRequired: 'Employee training and access monitoring',
      },
      signalMappings: ['unusual_data_access', 'privilege_escalation', 'failed_login_spike'],
      industries: ['banking', 'credit_union', 'insurance'],
      jurisdictions: ['US'],
    },

    // ════════════════════════════════════════════════════════
    // HIPAA — Health Insurance Portability and Accountability Act
    // ════════════════════════════════════════════════════════
    {
      framework: 'HIPAA',
      section: 'Privacy_Rule_164.502',
      title: 'Uses and Disclosures of PHI',
      description: 'Covered entities may not use or disclose protected health information except as permitted by the Privacy Rule. The minimum necessary standard requires limiting PHI access to the minimum necessary to accomplish the intended purpose.',
      requirements: {
        minimumNecessary: 'Limit access to minimum required for job function',
        permittedUses: ['Treatment', 'Payment', 'Healthcare operations'],
        authorizationRequired: 'For marketing, sale of PHI, psychotherapy notes',
        patientRights: ['Access to records', 'Amendment requests', 'Accounting of disclosures', 'Restriction requests'],
      },
      signalMappings: ['unusual_data_access', 'after_hours_access', 'privilege_escalation'],
      industries: ['healthcare'],
      jurisdictions: ['US'],
    },
    {
      framework: 'HIPAA',
      section: 'Security_Rule_164.312',
      title: 'Technical Safeguards',
      description: 'Covered entities must implement technical safeguards to protect electronic PHI including access controls, audit controls, integrity controls, and transmission security.',
      requirements: {
        accessControl: ['Unique user identification', 'Emergency access procedure', 'Automatic logoff', 'Encryption and decryption'],
        auditControls: 'Hardware, software, and procedural mechanisms to record and examine ePHI access',
        integrity: 'Protect ePHI from improper alteration or destruction',
        transmissionSecurity: 'Guard against unauthorized access during electronic transmission',
      },
      signalMappings: ['after_hours_access', 'data_exfiltration', 'mfa_bypass', 'privilege_escalation', 'failed_login_spike'],
      industries: ['healthcare'],
      jurisdictions: ['US'],
    },
    {
      framework: 'HIPAA',
      section: 'Breach_Notification_164.400',
      title: 'Breach Notification Rule',
      description: 'Covered entities must notify affected individuals, HHS, and in some cases the media following the discovery of a breach of unsecured PHI.',
      requirements: {
        individualNotification: 'Without unreasonable delay, no later than 60 days after discovery',
        hhsNotification: 'Annually for <500 records, within 60 days for 500+ records',
        mediaNotification: 'Required if 500+ residents of a state/jurisdiction affected',
        contentRequired: ['Description of breach', 'Types of information involved', 'Steps to protect from harm', 'Investigation description', 'Contact information'],
        riskAssessment: '4-factor test to determine if notification is required',
      },
      signalMappings: ['data_exfiltration', 'unusual_data_access', 'privilege_escalation'],
      industries: ['healthcare'],
      jurisdictions: ['US'],
    },
    {
      framework: 'HIPAA',
      section: 'Training_164.530',
      title: 'Administrative Requirements — Training',
      description: 'Covered entities must train all workforce members on policies and procedures regarding PHI. Training must occur within a reasonable period after hiring and whenever material changes occur.',
      requirements: {
        initialTraining: 'Within reasonable period after hiring',
        ongoingTraining: 'When material changes to policies occur',
        documentation: 'Training records must be maintained for 6 years',
        scope: 'All workforce members with access to PHI',
      },
      signalMappings: ['training_missed', 'policy_violation'],
      industries: ['healthcare'],
      jurisdictions: ['US'],
    },

    // ════════════════════════════════════════════════════════
    // GDPR — General Data Protection Regulation
    // ════════════════════════════════════════════════════════
    {
      framework: 'GDPR',
      section: 'Article_5',
      title: 'Principles Relating to Processing of Personal Data',
      description: 'Personal data must be processed lawfully, fairly, and transparently. It must be collected for specified purposes, adequate and relevant, accurate, kept no longer than necessary, and processed securely.',
      requirements: {
        principles: ['Lawfulness, fairness, transparency', 'Purpose limitation', 'Data minimisation', 'Accuracy', 'Storage limitation', 'Integrity and confidentiality', 'Accountability'],
        documentation: 'Controller must be able to demonstrate compliance',
      },
      signalMappings: ['unusual_data_access', 'data_exfiltration', 'consent_withdrawal', 'policy_violation'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'retail'],
      jurisdictions: ['EU', 'UK'],
    },
    {
      framework: 'GDPR',
      section: 'Article_33',
      title: 'Notification of Personal Data Breach to Supervisory Authority',
      description: 'In the case of a personal data breach, the controller shall notify the competent supervisory authority without undue delay and, where feasible, not later than 72 hours after becoming aware of it.',
      requirements: {
        notificationDeadline: '72 hours after becoming aware',
        contentRequired: ['Nature of breach', 'Categories and approximate number of data subjects', 'Contact details of DPO', 'Likely consequences', 'Measures taken or proposed'],
        exemption: 'Not required if breach is unlikely to result in risk to rights and freedoms',
        documentation: 'All breaches must be documented regardless of notification requirement',
      },
      signalMappings: ['data_exfiltration', 'unusual_data_access', 'regulatory_breach'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'retail'],
      jurisdictions: ['EU', 'UK'],
    },
    {
      framework: 'GDPR',
      section: 'Article_35',
      title: 'Data Protection Impact Assessment (DPIA)',
      description: 'Where processing is likely to result in a high risk to the rights and freedoms of natural persons, the controller shall carry out a DPIA prior to processing. This includes systematic and extensive profiling, large-scale processing of special categories, and systematic monitoring of public areas.',
      requirements: {
        triggerConditions: ['Systematic and extensive profiling', 'Large-scale processing of special categories', 'Systematic monitoring of public areas'],
        assessmentContent: ['Systematic description of processing', 'Necessity and proportionality assessment', 'Risk assessment', 'Measures to address risks'],
        consultationRequired: 'Must consult supervisory authority if risks cannot be mitigated',
      },
      signalMappings: ['policy_violation', 'unusual_data_access'],
      industries: ['banking', 'healthcare', 'insurance', 'technology'],
      jurisdictions: ['EU', 'UK'],
    },
    {
      framework: 'GDPR',
      section: 'Article_88',
      title: 'Processing in the Context of Employment',
      description: 'Member States may provide for more specific rules to ensure the protection of the rights and freedoms of employees in respect of the processing of personal data in the employment context, including for recruitment, performance of employment contract, management and planning, health and safety, and termination.',
      requirements: {
        lawfulBasis: 'Consent is generally insufficient for employment — legitimate interest or legal obligation preferred',
        employeeRights: ['Right to be informed about monitoring', 'Right to access personal data', 'Right to rectification', 'Right to object to processing'],
        monitoringConstraints: 'Must be proportionate, transparent, and have a lawful basis',
        worksCouncilConsultation: 'Required in some Member States before implementing monitoring',
      },
      signalMappings: ['consent_withdrawal', 'policy_violation'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'manufacturing'],
      jurisdictions: ['EU', 'UK'],
    },

    // ════════════════════════════════════════════════════════
    // NIST CSF — Cybersecurity Framework
    // ════════════════════════════════════════════════════════
    {
      framework: 'NIST_CSF',
      section: 'ID.RA',
      title: 'Risk Assessment (Identify)',
      description: 'The organization understands the cybersecurity risk to organizational operations, assets, and individuals. Asset vulnerabilities are identified and documented. Threats and vulnerabilities are identified and documented. Risk responses are identified and prioritized.',
      requirements: {
        assetInventory: 'Maintain inventory of all systems, data, and assets',
        vulnerabilityManagement: 'Regular vulnerability scanning and assessment',
        threatIntelligence: 'Monitor and incorporate current threat intelligence',
        riskPrioritization: 'Prioritize risks based on likelihood and impact',
      },
      signalMappings: ['system_anomaly', 'failed_login_spike', 'privilege_escalation'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'government', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'NIST_CSF',
      section: 'PR.AC',
      title: 'Access Control (Protect)',
      description: 'Access to assets and associated facilities is limited to authorized users, processes, and devices. Access permissions are managed incorporating principles of least privilege and separation of duties.',
      requirements: {
        identityManagement: 'Identities and credentials issued, managed, verified, revoked',
        accessEnforcement: 'Physical and logical access managed and enforced',
        remoteAccess: 'Remote access managed and controlled',
        accessPermissions: 'Least privilege and separation of duties enforced',
        networkIntegrity: 'Network integrity protected (segmentation, monitoring)',
      },
      signalMappings: ['after_hours_access', 'privilege_escalation', 'mfa_bypass', 'failed_login_spike', 'unusual_data_access'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'government', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'NIST_CSF',
      section: 'DE.CM',
      title: 'Continuous Monitoring (Detect)',
      description: 'The information system and assets are monitored at discrete intervals to identify cybersecurity events and verify the effectiveness of protective measures.',
      requirements: {
        networkMonitoring: 'Monitor network for cybersecurity events',
        physicalMonitoring: 'Monitor physical environment for cybersecurity events',
        personnelMonitoring: 'Monitor personnel activity for cybersecurity events',
        externalServiceProviders: 'Monitor external service provider activity',
        malwareDetection: 'Detect malicious code and unauthorized mobile code',
        vulnerabilityScanning: 'Perform vulnerability scans regularly',
      },
      signalMappings: ['after_hours_access', 'data_exfiltration', 'failed_login_spike', 'system_anomaly', 'unusual_data_access', 'privilege_escalation'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'government', 'manufacturing'],
      jurisdictions: ['US'],
    },
    {
      framework: 'NIST_CSF',
      section: 'RS.RP',
      title: 'Response Planning (Respond)',
      description: 'Response processes and procedures are executed and maintained to ensure timely response to detected cybersecurity events.',
      requirements: {
        responsePlan: 'Documented incident response plan',
        executionDrills: 'Regular testing and exercising of response plan',
        communication: 'Coordination with internal and external stakeholders',
        analysis: 'Analysis conducted to ensure adequate response',
        mitigation: 'Activities performed to prevent expansion and mitigate effects',
        improvements: 'Response activities reviewed for lessons learned',
      },
      signalMappings: ['data_exfiltration', 'system_anomaly', 'regulatory_breach'],
      industries: ['banking', 'healthcare', 'insurance', 'technology', 'government', 'manufacturing'],
      jurisdictions: ['US'],
    },

    // ════════════════════════════════════════════════════════
    // PCI DSS — Payment Card Industry Data Security Standard
    // ════════════════════════════════════════════════════════
    {
      framework: 'PCI_DSS',
      section: 'Requirement_10',
      title: 'Log and Monitor All Access to System Components and Cardholder Data',
      description: 'Implement logging mechanisms and audit trails to track user activities, detect anomalies, and establish accountability for all access to system components and cardholder data.',
      requirements: {
        auditTrail: 'Log all individual user access to cardholder data',
        logContent: ['User identification', 'Type of event', 'Date and time', 'Success or failure', 'Origination of event', 'Identity of affected data'],
        logRetention: 'At least 12 months, with minimum 3 months immediately available',
        dailyReview: 'Review logs and security events daily',
        integrityMonitoring: 'File-integrity monitoring or change-detection on logs',
      },
      signalMappings: ['after_hours_access', 'unusual_data_access', 'privilege_escalation', 'failed_login_spike'],
      industries: ['banking', 'retail'],
      jurisdictions: ['US', 'EU', 'UK'],
    },
  ];

  let created = 0;
  for (const rule of rules) {
    await prisma.regulatoryRule.create({ data: rule });
    created++;
    console.log(`  [${created}/${rules.length}] ${rule.framework} — ${rule.section}: ${rule.title}`);
  }

  console.log('');
  console.log(`Seeded ${created} regulatory rules across ${new Set(rules.map(r => r.framework)).size} frameworks.`);

  // Summary
  const frameworks = new Map<string, number>();
  for (const r of rules) {
    frameworks.set(r.framework, (frameworks.get(r.framework) ?? 0) + 1);
  }
  for (const [fw, count] of frameworks) {
    console.log(`  ${fw}: ${count} rules`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
