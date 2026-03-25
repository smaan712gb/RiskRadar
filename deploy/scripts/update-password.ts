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
  const email = process.argv[2] || (await prompt('User email: '));
  const tenantSlug = process.argv[3] || (await prompt('Tenant slug: '));
  const password = process.env.RISKRADAR_NEW_PASSWORD || (await prompt('New password: '));

  if (!email || !tenantSlug || !password) {
    console.error('Usage: tsx update-password.ts <email> <tenant-slug>');
    console.error('Set RISKRADAR_NEW_PASSWORD env var or enter interactively.');
    process.exit(1);
  }

  if (password.length < 12) {
    console.error('Password must be at least 12 characters.');
    process.exit(1);
  }

  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  const passwordHash = `${salt}:${hash}`;

  const tenant = await prisma.tenant.findFirst({ where: { slug: tenantSlug } });
  if (!tenant) {
    console.error(`Tenant "${tenantSlug}" not found.`);
    process.exit(1);
  }

  const result = await prisma.user.updateMany({
    where: { tenantId: tenant.id, email },
    data: { passwordHash },
  });

  if (result.count === 0) {
    console.error(`No user found with email "${email}" in tenant "${tenantSlug}".`);
    process.exit(1);
  }

  console.log(`Password updated for ${email} (${result.count} row(s)).`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
