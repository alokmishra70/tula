import { Controller, Get } from '@nestjs/common';
import { TodayQuerySchema, type TodayQuery, type TodayResponse } from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodQuery } from '../../common/decorators/request.decorators';
import { TodayService } from './today.service';

@Controller('today')
export class TodayController {
  constructor(private readonly today: TodayService) {}

  @Get()
  get(
    @CurrentUser() user: RequestUser,
    @ZodQuery(TodayQuerySchema) query: TodayQuery,
  ): Promise<TodayResponse> {
    return this.today.get(user, query.date);
  }
}
