import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { AiCacheStore } from './ai-cache.store';

@Injectable()
export class PrismaAiCacheStore extends AiCacheStore {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async get(key: string): Promise<unknown | null> {
    const row = await this.prisma.aiCache.findUnique({ where: { key } });
    return row?.response ?? null;
  }

  async set(key: string, value: unknown): Promise<void> {
    const response = value as Prisma.InputJsonValue;
    await this.prisma.aiCache.upsert({
      where: { key },
      create: { key, response },
      update: { response, createdAt: new Date() },
    });
  }
}
