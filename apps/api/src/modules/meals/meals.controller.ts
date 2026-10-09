import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  CreateMealRequestSchema,
  ParseMealRequestSchema,
  QuickMealsQuerySchema,
  UpdateMealRequestSchema,
  type CreateMealRequest,
  type DeleteMealResponse,
  type MealWriteResponse,
  type ParseMealRequest,
  type ParseMealResponse,
  type QuickMeal,
  type QuickMealsQuery,
  type UpdateMealRequest,
} from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodBody, ZodQuery } from '../../common/decorators/request.decorators';
import { AiRateLimited } from '../../common/throttling/throttling';
import { IdempotencyKey } from './idempotency-key.decorator';
import { MealsService } from './meals.service';

@Controller('meals')
export class MealsController {
  constructor(private readonly meals: MealsService) {}

  @Post('parse')
  @AiRateLimited()
  @HttpCode(HttpStatus.OK)
  parse(
    @CurrentUser() user: RequestUser,
    @ZodBody(ParseMealRequestSchema) body: ParseMealRequest,
  ): Promise<ParseMealResponse> {
    return this.meals.parse(user, body);
  }

  @Post()
  create(
    @CurrentUser() user: RequestUser,
    @IdempotencyKey() key: string,
    @ZodBody(CreateMealRequestSchema) body: CreateMealRequest,
  ): Promise<MealWriteResponse> {
    return this.meals.create(user, key, body);
  }

  @Get('frequent')
  frequent(
    @CurrentUser() user: RequestUser,
    @ZodQuery(QuickMealsQuerySchema) query: QuickMealsQuery,
  ): Promise<QuickMeal[]> {
    return this.meals.quickMeals(user, query.mealType);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
    @ZodBody(UpdateMealRequestSchema) body: UpdateMealRequest,
  ): Promise<MealWriteResponse> {
    return this.meals.update(user, id, body);
  }

  @Delete(':id')
  remove(
    @CurrentUser() user: RequestUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DeleteMealResponse> {
    return this.meals.remove(user, id);
  }
}
