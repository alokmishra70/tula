import { Global, Module } from '@nestjs/common';
import { Clock, SystemClock } from '../../common/clock';
import { DatabaseHealth } from './database-health';
import { DbContext } from './db-context';
import { PrismaService } from './prisma.service';
import { TransactionManager } from './transaction-manager';

@Global()
@Module({
  providers: [
    PrismaService,
    DbContext,
    { provide: DatabaseHealth, useExisting: PrismaService },
    { provide: TransactionManager, useExisting: DbContext },
    { provide: Clock, useClass: SystemClock },
  ],
  exports: [PrismaService, DbContext, DatabaseHealth, TransactionManager, Clock],
})
export class DatabaseModule {}
