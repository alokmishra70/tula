import 'reflect-metadata';
import type { NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';
import { LlmProvider } from '../../src/ai/llm-provider';
import { AppModule } from '../../src/app.module';
import { configureApp, createFastifyAdapter } from '../../src/app.setup';
import { Clock } from '../../src/common/clock';
import { PrismaService } from '../../src/infrastructure/database/prisma.service';

/** Settable clock so date and nudge logic is deterministic. */
export class TestClock extends Clock {
  constructor(public current = new Date('2026-10-08T08:30:00Z')) {
    super();
  }
  now(): Date {
    return this.current;
  }
  set(iso: string): void {
    this.current = new Date(iso);
  }
}

export interface TestApp {
  app: NestFastifyApplication;
  clock: TestClock;
  prisma: PrismaService;
  close(): Promise<void>;
}

export async function createTestApp(options: { llm?: LlmProvider } = {}): Promise<TestApp> {
  const clock = new TestClock();
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(Clock)
    .useValue(clock);
  if (options.llm) builder = builder.overrideProvider(LlmProvider).useValue(options.llm);

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestFastifyApplication>(createFastifyAdapter());
  await configureApp(app);
  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  const prisma = app.get(PrismaService);
  await resetDatabase(prisma);
  return { app, clock, prisma, close: () => app.close() };
}

/** Clears user data; the dish table seeded in global setup is kept. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE users, ai_cache CASCADE');
}
