import { Module } from '@nestjs/common';
import { DEFAULT_NUDGE_RULES, NudgeEngine } from '../../domain/nudges';
import { NudgeRepository, PrismaNudgeRepository } from './nudge.repository';
import { NUDGE_ENGINE, NudgeService } from './nudge.service';
import { NudgesController } from './nudges.controller';

@Module({
  controllers: [NudgesController],
  providers: [
    NudgeService,
    { provide: NUDGE_ENGINE, useFactory: () => new NudgeEngine(DEFAULT_NUDGE_RULES) },
    { provide: NudgeRepository, useClass: PrismaNudgeRepository },
  ],
  exports: [NudgeService],
})
export class NudgesModule {}
