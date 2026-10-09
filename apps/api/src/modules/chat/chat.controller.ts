import { Controller, Get, Post, Req, Res } from '@nestjs/common';
import { ChatRequestSchema, HEADERS, type ChatMessage, type ChatRequest } from '@tula/shared';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { RequestUser } from '../../common/auth/request-user';
import { CurrentUser, ZodBody } from '../../common/decorators/request.decorators';
import { AiRateLimited } from '../../common/throttling/throttling';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('messages')
  history(@CurrentUser() user: RequestUser): Promise<ChatMessage[]> {
    return this.chat.history(user.id);
  }

  /** Streams the reply as server-sent events: token, card, done or error. */
  @Post()
  @AiRateLimited()
  async send(
    @CurrentUser() user: RequestUser,
    @ZodBody(ChatRequestSchema) body: ChatRequest,
    @Req() request: FastifyRequest,
    @Res() reply: FastifyReply,
  ): Promise<void> {
    reply.hijack();
    const raw = reply.raw;
    // Hijacked replies skip onSend hooks, so carry over CORS and request-id headers here.
    raw.writeHead(200, {
      ...(reply.getHeaders() as Record<string, string | string[]>),
      [HEADERS.requestId]: request.id,
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
      connection: 'keep-alive',
      'x-accel-buffering': 'no',
    });
    const abort = new AbortController();
    raw.on('close', () => abort.abort());
    try {
      for await (const event of this.chat.reply(user, body.message, abort.signal)) {
        if (abort.signal.aborted) break;
        raw.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    } finally {
      raw.end();
    }
  }
}
