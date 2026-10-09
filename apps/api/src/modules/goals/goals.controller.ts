import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PlanRequestSchema, type Plan, type PlanRequest } from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodBody } from '../../common/decorators/request.decorators';
import { AiRateLimited } from '../../common/throttling/throttling';
import { GoalsService } from './goals.service';

@Controller('goals')
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Post('plan')
  @AiRateLimited()
  @HttpCode(HttpStatus.OK)
  createPlan(
    @CurrentUser() user: RequestUser,
    @ZodBody(PlanRequestSchema) body: PlanRequest,
  ): Promise<Plan> {
    return this.goals.createPlan(user.id, body);
  }

  @Get('plan')
  activePlan(@CurrentUser() user: RequestUser): Promise<Plan> {
    return this.goals.activePlan(user.id);
  }
}
