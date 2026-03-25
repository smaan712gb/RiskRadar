import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';
import { createInterface } from 'node:readline';

const prisma = new PrismaClient();

function prompt(question: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

async function main() {
  const tenantSlug = process.argv[2] || (await prompt('Tenant slug: '));
  const email = process.argv[3] || (await prompt('Admin email: '));
  const name = process.argv[4] || (await prompt('Admin name: '));
  const password = process.env.RISKRADAR_ADMIN_PASSWORD || (await prompt('Admin password: '));

  if (!tenantSlug || !email || !name || !password) {
    console.error('Usage: tsx update-admin.ts <tenant-slug> <email> <name>');
    console.error('Set RISKRADAR_ADMIN_PASSWORD env var or enter interactively.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  console.log('Connecting to database...');

  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  const passwordHash = `${salt}:${hash}`;

  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } });
  if (!tenant) {
    console.error(`Tenant "${tenantSlug}" not found.`);
    process.exit(1);
  }

  // Create or update admin user
  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name, role: 'admin' },
    });
    console.log(`Updated admin: ${email}`);
  } else {
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email,
        name,
        passwordHash,
        role: 'admin',
        permissions: [],
        isActive: true,
      },
    });
    console.log(`Created admin: ${email}`);
  }

  console.log('Admin user configured successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
