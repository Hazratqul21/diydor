/**
 * Admin + standart sozlama + obuna rejalarini yaratadi (idempotent).
 *   ishlatish: npx ts-node prisma/admin-seed.ts
 * Parolni ADMIN_PASSWORD env orqali bersa bo'ladi (default: admin12345).
 */
import { PrismaClient, SubTier, SubPeriod } from '@prisma/client';
import { randomBytes, scryptSync } from 'node:crypto';

const prisma = new PrismaClient();

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

// Strategiya hujjatidagi narxlar (so'm) — admin paneldan o'zgartiriladi
const PLANS: { tier: SubTier; period: SubPeriod; priceSom: number; discountPercent: number; sortOrder: number }[] = [
  { tier: 'PLUS', period: 'WEEK', priceSom: 19_000, discountPercent: 0, sortOrder: 1 },
  { tier: 'PLUS', period: 'MONTH', priceSom: 49_000, discountPercent: 0, sortOrder: 2 },
  { tier: 'PLUS', period: 'YEAR', priceSom: 399_000, discountPercent: 32, sortOrder: 3 },
  { tier: 'GOLD', period: 'WEEK', priceSom: 35_000, discountPercent: 0, sortOrder: 4 },
  { tier: 'GOLD', period: 'MONTH', priceSom: 99_000, discountPercent: 0, sortOrder: 5 },
  { tier: 'GOLD', period: 'YEAR', priceSom: 799_000, discountPercent: 33, sortOrder: 6 },
  { tier: 'PLATINUM', period: 'WEEK', priceSom: 55_000, discountPercent: 0, sortOrder: 7 },
  { tier: 'PLATINUM', period: 'MONTH', priceSom: 169_000, discountPercent: 0, sortOrder: 8 },
  { tier: 'PLATINUM', period: 'YEAR', priceSom: 1_390_000, discountPercent: 31, sortOrder: 9 },
];

async function main() {
  const email = (process.env.ADMIN_EMAIL ?? 'admin@diydor.uz').toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? 'admin12345';

  const admin = await prisma.admin.upsert({
    where: { email },
    create: { email, passwordHash: hashPassword(password), name: 'Bosh admin', role: 'SUPERADMIN' },
    update: {},
  });
  console.log(`✓ Admin: ${admin.email}`);

  await prisma.appConfig.upsert({
    where: { id: 'singleton' },
    create: { id: 'singleton' },
    update: {},
  });
  console.log('✓ AppConfig (standart sozlamalar)');

  for (const p of PLANS) {
    await prisma.subscriptionPlan.upsert({
      where: { tier_period: { tier: p.tier, period: p.period } },
      create: p,
      update: { priceSom: p.priceSom, discountPercent: p.discountPercent, sortOrder: p.sortOrder },
    });
  }
  console.log(`✓ ${PLANS.length} ta obuna rejasi`);
  console.log(`\nKirish: ${email} / ${password}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
