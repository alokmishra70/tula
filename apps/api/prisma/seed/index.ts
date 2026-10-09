import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../../src/generated/prisma/client';
import { seedDemoHistory } from './demo-history';
import { DEMO_USERS } from './demo-users';
import { DISHES } from './dishes';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function seedDishes(prisma: PrismaClient): Promise<void> {
  for (const { kcal, ...dish } of DISHES) {
    const data = { ...dish, kcalPerUnit: kcal };
    await prisma.dishRef.upsert({ where: { name: dish.name }, create: data, update: data });
  }
}

async function seedDemoUsers(prisma: PrismaClient): Promise<void> {
  for (const { weightHistoryKg, ...profile } of DEMO_USERS) {
    const user = await prisma.user.upsert({
      where: { deviceId: profile.deviceId },
      create: { ...profile, isDemo: true },
      update: { ...profile, isDemo: true },
    });

    await prisma.weightLog.deleteMany({ where: { userId: user.id } });
    const now = Date.now();
    await prisma.weightLog.createMany({
      data: weightHistoryKg.map((weightKg, index) => ({
        userId: user.id,
        weightKg,
        loggedAt: new Date(now - (weightHistoryKg.length - 1 - index) * WEEK_MS),
      })),
    });
  }
}

async function main(): Promise<void> {
  const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!connectionString) throw new Error('DIRECT_URL or DATABASE_URL must be set');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  try {
    await seedDishes(prisma);
    if (process.argv.includes('--dishes-only')) return;
    await seedDemoUsers(prisma);
    await seedDemoHistory(prisma);
    process.stdout.write(`Seeded ${DISHES.length} dishes and ${DEMO_USERS.length} demo users\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  process.stderr.write(`Seed failed: ${String(error)}\n`);
  process.exit(1);
});
