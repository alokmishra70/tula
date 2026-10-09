import { Module } from '@nestjs/common';
import { GoalsModule } from '../goals/goals.module';
import { MediaModule } from '../media/media.module';
import { DailySummaryRepository, PrismaDailySummaryRepository } from './daily-summary.repository';
import { DishCatalog, PrismaDishCatalog } from './dish-catalog';
import { MealEnricher } from './meal-enricher';
import { MealMapper } from './meal.mapper';
import { MealRepository, PrismaMealRepository } from './meal.repository';
import { MealsController } from './meals.controller';
import { MealsService } from './meals.service';
import { MealParsingService, MEAL_INPUT_PARSERS } from './parsing/meal-parsing.service';
import { PhotoParser } from './parsing/photo.parser';
import { TextParser } from './parsing/text.parser';
import { VoiceParser } from './parsing/voice.parser';
import { PendingMealWorker } from './pending-meal.worker';
import { SummaryService } from './summary.service';

@Module({
  imports: [GoalsModule, MediaModule],
  controllers: [MealsController],
  providers: [
    MealsService,
    SummaryService,
    MealParsingService,
    MealEnricher,
    MealMapper,
    PendingMealWorker,
    PhotoParser,
    VoiceParser,
    TextParser,
    {
      provide: MEAL_INPUT_PARSERS,
      inject: [PhotoParser, VoiceParser, TextParser],
      useFactory: (...parsers: [PhotoParser, VoiceParser, TextParser]) => parsers,
    },
    { provide: MealRepository, useClass: PrismaMealRepository },
    { provide: DailySummaryRepository, useClass: PrismaDailySummaryRepository },
    { provide: DishCatalog, useClass: PrismaDishCatalog },
  ],
  exports: [MealsService, SummaryService, MealParsingService],
})
export class MealsModule {}
