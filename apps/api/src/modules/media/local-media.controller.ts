import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import type { FastifyReply } from 'fastify';
import { Public } from '../../common/auth/auth.metadata';
import { AppException } from '../../common/errors/app.exception';
import { mimeTypeOf } from './media-keys';
import { LOCAL_MEDIA_ROUTE, LocalDiskStorage } from './storage/local-disk.storage';
import { ObjectStorage } from './storage/object-storage';

/** Serves signed upload and download URLs when STORAGE_DRIVER=local. The token is the credential. */
@Public()
@SkipThrottle()
@Controller(LOCAL_MEDIA_ROUTE)
export class LocalMediaController {
  constructor(private readonly storage: ObjectStorage) {}

  @Put()
  @HttpCode(HttpStatus.NO_CONTENT)
  async upload(
    @Query('token') token: string,
    @Headers('content-type') contentType: string | undefined,
    @Body() body: unknown,
  ): Promise<void> {
    const storage = this.localStorage();
    const claims = storage.verify(token ?? '');
    if (claims?.op !== 'put') throw AppException.notFound('Upload URL');
    if (!Buffer.isBuffer(body) || body.length === 0) {
      throw AppException.validation([{ path: 'body', message: 'Expected a file body' }]);
    }
    if (contentType?.split(';')[0] !== claims.contentType || body.length > (claims.maxBytes ?? 0)) {
      throw AppException.validation([
        { path: 'body', message: 'File does not match the signed upload' },
      ]);
    }
    await storage.write(claims.key, body);
  }

  @Get()
  async download(@Query('token') token: string, @Res() reply: FastifyReply): Promise<void> {
    const storage = this.localStorage();
    const claims = storage.verify(token ?? '');
    const data = claims?.op === 'get' ? await storage.read(claims.key) : null;
    if (!claims || !data) throw AppException.notFound('File');
    await reply
      .header('content-type', mimeTypeOf(claims.key))
      .header('cache-control', 'private, max-age=300')
      .send(data);
  }

  private localStorage(): LocalDiskStorage {
    if (!(this.storage instanceof LocalDiskStorage)) throw AppException.notFound('Route');
    return this.storage;
  }
}
