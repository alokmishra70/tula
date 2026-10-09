import { Controller, HttpCode, HttpStatus, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser } from '../../common/decorators/request.decorators';
import { NudgeService } from './nudge.service';

@Controller('nudges')
export class NudgesController {
  constructor(private readonly nudges: NudgeService) {}

  @Post(':id/act')
  @HttpCode(HttpStatus.NO_CONTENT)
  act(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.nudges.resolve(user.id, id, 'acted');
  }

  @Post(':id/dismiss')
  @HttpCode(HttpStatus.NO_CONTENT)
  dismiss(@CurrentUser() user: RequestUser, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.nudges.resolve(user.id, id, 'dismissed');
  }
}
