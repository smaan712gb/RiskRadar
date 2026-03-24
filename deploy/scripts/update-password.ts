import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  const password = 'Pakistan2026';
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  const passwordHash = `${salt}:${hash}`;

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-bank' } });
  if (!tenant) { console.log('Tenant not found!'); return; }

  // Update smaan2011@gmail.com
  const r1 = await prisma.user.updateMany({
    where: { tenantId: tenant.id, email: 'smaan2011@gmail.com' },
    data: { passwordHash },
  });
  console.log(`smaan2011@gmail.com: ${r1.count} updated`);

  // Update smaan@aimadds.com
  const r2 = await prisma.user.updateMany({
    where: { tenantId: tenant.id, email: 'smaan@aimadds.com' },
    data: { passwordHash },
  });
  console.log(`smaan@aimadds.com: ${r2.count} updated`);

  console.log('Password updated to: Pakistan2026');
}

main().catch(console.error).finally(() => prisma.$disconnect());
