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

  // Create default tenant
  const tenant = await prisma.tenant.upsert({
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

  console.log(`Created tenant: ${tenant.name} (${tenant.id})`);

  // Create system roles
  const roles = [
    { name: 'admin', description: 'Full system access', isSystem: true },
    { name: 'compliance_officer', description: 'Compliance and regulatory oversight', isSystem: true },
    { name: 'ciso', description: 'Security leadership', isSystem: true },
    { name: 'analyst', description: 'Alert review and investigation', isSystem: true },
    { name: 'manager', description: 'Team oversight and escalation review', isSystem: true },
    { name: 'auditor', description: 'Read-only audit access', isSystem: true },
    { name: 'regulator', description: 'Read-only regulatory examination access', isSystem: true },
  ];

  for (const role of roles) {
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

  console.log(`Created ${roles.length} system roles`);

  // Create admin user
  const adminPassword = await hashPassword('admin123!');
  const admin = await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'admin@riskradar.dev' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@riskradar.dev',
      name: 'System Administrator',
      passwordHash: adminPassword,
      role: 'admin',
      permissions: [],
      isActive: true,
    },
  });

  console.log(`Created admin user: ${admin.email}`);

  // Create sample analyst user
  const analystPassword = await hashPassword('analyst123!');
  await prisma.user.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'analyst@riskradar.dev' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'analyst@riskradar.dev',
      name: 'Jane Analyst',
      passwordHash: analystPassword,
      role: 'analyst',
      permissions: [],
      isActive: true,
    },
  });

  console.log('Created sample analyst user');

  // Seed regulatory rules (BSA/AML basics)
  const regulatoryRules = [
    {
      framework: 'BSA_AML',
      section: '31_CFR_1020.320',
      title: 'SAR Filing Requirements',
      description: 'Financial institutions must file SARs for transactions involving $5,000+ that the institution knows or suspects involve funds from illegal activity.',
      requirements: {
        thresholds: { amount: 5000, currency: 'USD' },
        filingDeadline: '30 calendar days from detection',
        retentionPeriod: '5 years',
      },
      signalMappings: ['override_transaction', 'unusual_amount', 'new_payee'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
    {
      framework: 'BSA_AML',
      section: 'FinCEN_2025_A003',
      title: 'Insider Threat Red Flag Indicators',
      description: 'Indicators of potential insider facilitation of financial crime.',
      requirements: {
        indicators: [
          'Override clustering during supervisor absence',
          'After-hours system access with transaction activity',
          'New payee accounts created proximate to large transfers',
          'Pattern of transactions just below reporting thresholds',
        ],
      },
      signalMappings: ['override_transaction', 'after_hours_access', 'new_payee', 'approval_bypass'],
      industries: ['banking', 'credit_union'],
      jurisdictions: ['US'],
    },
  ];

  for (const rule of regulatoryRules) {
    await prisma.regulatoryRule.create({ data: rule });
  }

  console.log(`Created ${regulatoryRules.length} regulatory rules`);
  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
