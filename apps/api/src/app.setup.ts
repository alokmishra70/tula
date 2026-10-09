import { randomUUID } from 'node:crypto';
import helmet from '@fastify/helmet';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { ALLOWED_CONTENT_TYPES, HEADERS, LIMITS } from '@tula/shared';
import { Logger } from 'nestjs-pino';
import { AppConfig } from './config/app-config';

export const API_PREFIX = 'v1';
const BODY_LIMIT_BYTES = 1024 * 1024;

export function createFastifyAdapter(): FastifyAdapter {
  return new FastifyAdapter({
    bodyLimit: BODY_LIMIT_BYTES,
    trustProxy: true,
    requestIdHeader: HEADERS.requestId,
    genReqId: () => randomUUID(),
  });
}

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  const config = app.get(AppConfig);

  app.useLogger(app.get(Logger));
  app.setGlobalPrefix(API_PREFIX);
  app.enableShutdownHooks();

  const fastify = app.getHttpAdapter().getInstance();
  fastify.addHook('onSend', async (request, reply) => {
    reply.header(HEADERS.requestId, request.id);
  });

  // Raw file bodies for signed local uploads.
  const binaryTypes = [...new Set(Object.values(ALLOWED_CONTENT_TYPES).flat())];
  fastify.addContentTypeParser(
    binaryTypes,
    { parseAs: 'buffer', bodyLimit: LIMITS.uploadMaxBytes },
    (_request, body, done) => done(null, body),
  );

  await app.register(helmet);
  app.enableCors({
    origin: config.corsOrigins,
    allowedHeaders: ['content-type', HEADERS.deviceId, HEADERS.idempotencyKey, HEADERS.requestId],
    exposedHeaders: [HEADERS.requestId],
  });
}
