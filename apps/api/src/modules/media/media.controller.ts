import { Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  UploadUrlRequestSchema,
  type UploadUrlRequest,
  type UploadUrlResponse,
} from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodBody } from '../../common/decorators/request.decorators';
import { MediaService } from './media.service';

@Controller('media')
export class MediaController {
  constructor(private readonly media: MediaService) {}

  @Post('upload-url')
  @HttpCode(HttpStatus.OK)
  createUploadUrl(
    @CurrentUser() user: RequestUser,
    @ZodBody(UploadUrlRequestSchema) body: UploadUrlRequest,
  ): Promise<UploadUrlResponse> {
    return this.media.createUploadUrl(user.id, body);
  }
}
