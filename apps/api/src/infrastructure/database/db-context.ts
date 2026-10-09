import { AsyncLocalStorage } from 'node:async_hooks';
import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../generated/prisma/client';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction-manager';

const TRANSACTION_TIMEOUT_MS = 15_000;

/** Gives repositories the active transaction client, or the root client outside one. */
@Injectable()
export class DbContext extends TransactionManager {
  private readonly storage = new AsyncLocalStorage<Prisma.TransactionClient>();

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  get client(): Prisma.TransactionClient {
    return this.storage.getStore() ?? this.prisma;
  }

  run<T>(work: () => Promise<T>): Promise<T> {
    if (this.storage.getStore()) return work();
    return this.prisma.$transaction((tx) => this.storage.run(tx, work), {
      timeout: TRANSACTION_TIMEOUT_MS,
    });
  }
}
