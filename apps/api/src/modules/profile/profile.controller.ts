import { Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { UpsertProfileRequestSchema, type Profile, type UpsertProfileRequest } from '@tula/shared';
import { AllowUnregistered } from '../../common/auth/auth.metadata';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, DeviceId, ZodBody } from '../../common/decorators/request.decorators';
import { ProfileService } from './profile.service';

@Controller('profile')
export class ProfileController {
  constructor(private readonly profiles: ProfileService) {}

  @Post()
  @AllowUnregistered()
  @HttpCode(HttpStatus.OK)
  upsert(
    @DeviceId() deviceId: string,
    @ZodBody(UpsertProfileRequestSchema) body: UpsertProfileRequest,
  ): Promise<Profile> {
    return this.profiles.upsert(deviceId, body);
  }

  @Get()
  get(@CurrentUser() user: RequestUser): Promise<Profile> {
    return this.profiles.get(user.id);
  }
}
