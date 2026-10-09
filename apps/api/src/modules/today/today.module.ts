import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { MarkersModule } from '../markers/markers.module';
import { MealsModule } from '../meals/meals.module';
import { NudgesModule } from '../nudges/nudges.module';
import { ProfileModule } from '../profile/profile.module';
import { TodayController } from './today.controller';
import { TodayService } from './today.service';

@Module({
  imports: [ProfileModule, GoalsModule, MealsModule, MarkersModule, NudgesModule],
  controllers: [TodayController],
  providers: [TodayService],
})
export class TodayModule {}
