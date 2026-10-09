import { Module } from '@nestjs/common';
import { MarkersModule } from '../markers/markers.module';
import { ProfileModule } from '../profile/profile.module';
import { GoalRepository, PrismaGoalRepository } from './goal.repository';
import { GoalsController } from './goals.controller';
import { GoalsService } from './goals.service';

@Module({
  imports: [ProfileModule, MarkersModule],
  controllers: [GoalsController],
  providers: [GoalsService, { provide: GoalRepository, useClass: PrismaGoalRepository }],
  exports: [GoalsService],
})
export class GoalsModule {}
