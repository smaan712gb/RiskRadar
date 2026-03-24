import { PrismaClient } from '@prisma/client';
import { createHash, randomBytes } from 'node:crypto';

const prisma = new PrismaClient();

async function main() {
  console.log('Connecting to database...');

  const password = 'GG7124me$';
  const salt = randomBytes(16).toString('hex');
  const hash = createHash('sha256').update(password + salt).digest('hex');
  const passwordHash = `${salt}:${hash}`;

  const tenant = await prisma.tenant.findFirst({ where: { slug: 'demo-bank' } });
  if (!tenant) {
    console.log('ERROR: Tenant demo-bank not found!');
    return;
  }
  console.log('Tenant found:', tenant.id);

  // Update existing admin to smaan2011@gmail.com
  const updated = await prisma.user.updateMany({
    where: { tenantId: tenant.id, email: 'admin@riskradar.dev' },
    data: { email: 'smaan2011@gmail.com', name: 'Salman Maan', passwordHash },
  });
  console.log(`Updated admin@riskradar.dev -> smaan2011@gmail.com: ${updated.count} row(s)`);

  // Create or update smaan@aimadds.com
  const existing = await prisma.user.findFirst({
    where: { tenantId: tenant.id, email: 'smaan@aimadds.com' },
  });

  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { passwordHash, name: 'Salman Maan', role: 'admin' },
    });
    console.log('Updated existing: smaan@aimadds.com');
  } else {
    await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: 'smaan@aimadds.com',
        name: 'Salman Maan',
        passwordHash,
        role: 'admin',
        permissions: [],
        isActive: true,
      },
    });
    console.log('Created: smaan@aimadds.com (admin)');
  }

  console.log('');
  console.log('=== Login Credentials ===');
  console.log('Tenant slug: demo-bank');
  console.log('Email 1: smaan2011@gmail.com');
  console.log('Email 2: smaan@aimadds.com');
  console.log('Password: GG7124me$');
  console.log('========================');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
