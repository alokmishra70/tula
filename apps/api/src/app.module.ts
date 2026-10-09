import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { HEADERS } from '@tula/shared';
import { LoggerModule } from 'nestjs-pino';
import { AiModule } from './ai/ai.module';
import { DeviceGuard } from './common/auth/device.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DeviceThrottlerGuard, throttlerOptions } from './common/throttling/throttling';
import { AppConfig } from './config/app-config';
import { ConfigModule } from './config/config.module';
import { DatabaseModule } from './infrastructure/database/database.module';
import { ChatModule } from './modules/chat/chat.module';
import { GoalsModule } from './modules/goals/goals.module';
import { HealthModule } from './modules/health/health.module';
import { MealsModule } from './modules/meals/meals.module';
import { MediaModule } from './modules/media/media.module';
import { NudgesModule } from './modules/nudges/nudges.module';
import { ReportsModule } from './modules/reports/reports.module';
import { TodayModule } from './modules/today/today.module';
import { ProfileModule } from './modules/profile/profile.module';

@Module({
  imports: [
    ConfigModule,
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.logLevel,
          transport: config.isProduction ? undefined : { target: 'pino-pretty' },
          customProps: (req) => ({ deviceId: req.headers[HEADERS.deviceId] }),
          redact: ['req.headers.authorization', 'req.headers.cookie'],
        },
      }),
    }),
    ThrottlerModule.forRoot(throttlerOptions),
    DatabaseModule,
    AiModule,
    HealthModule,
    ProfileModule,
    GoalsModule,
    MediaModule,
    MealsModule,
    NudgesModule,
    TodayModule,
    ReportsModule,
    ChatModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    // Device identity first, so throttling can key on a validated device ID.
    { provide: APP_GUARD, useClass: DeviceGuard },
    { provide: APP_GUARD, useClass: DeviceThrottlerGuard },
  ],
})
export class AppModule {}
