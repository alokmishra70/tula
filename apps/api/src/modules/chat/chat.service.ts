import { Injectable, Logger } from '@nestjs/common';
import type { ChatCard, ChatMessage, ChatStreamEvent } from '@tula/shared';
import { AI_TIMEOUTS_MS } from '../../ai/ai.constants';
import { AiUnavailableError } from '../../ai/llm-errors';
import { LlmProvider, type ChatTurn, type ToolCall } from '../../ai/llm-provider';
import { chatSystemPrompt } from '../../ai/prompts';
import type { RequestUser } from '../../common/auth/request-user';
import { Clock } from '../../common/clock';
import { localClock } from '../../domain/time';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import { ProfileService } from '../profile/profile.service';
import { ChatMessageRepository } from './chat-message.repository';
import { CHAT_TOOLS, ChatToolbox } from './chat-tools';

const CONTEXT_MESSAGES = 20;
const HISTORY_PAGE = 50;
const MAX_TOOL_ROUNDS = 3;
const FALLBACK_REPLY = 'Done.';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly messages: ChatMessageRepository,
    private readonly toolbox: ChatToolbox,
    private readonly profiles: ProfileService,
    private readonly llm: LlmProvider,
    private readonly tx: TransactionManager,
    private readonly clock: Clock,
  ) {}

  history(userId: string): Promise<ChatMessage[]> {
    return this.messages.recent(userId, HISTORY_PAGE);
  }

  /**
   * Streams one assistant reply, running tools as the model asks for them. Messages are
   * stored only when the reply completes, so a failed send can be retried without duplicates.
   */
  async *reply(
    user: RequestUser,
    message: string,
    signal?: AbortSignal,
  ): AsyncGenerator<ChatStreamEvent> {
    const startedAt = this.clock.now();
    try {
      const { name } = await this.profiles.get(user.id);
      const clock = localClock(startedAt, user.timezone);
      const system = chatSystemPrompt({
        name,
        localDate: clock.date,
        localTime: `${String(clock.hour).padStart(2, '0')}:${String(clock.minute).padStart(2, '0')}`,
      });
      const turns: ChatTurn[] = [
        ...(await this.messages.recent(user.id, CONTEXT_MESSAGES)).map((m): ChatTurn =>
          m.role === 'user'
            ? { role: 'user', content: m.content }
            : { role: 'assistant', content: m.content },
        ),
        { role: 'user', content: message },
      ];

      let content = '';
      const cards: ChatCard[] = [];
      const toolCalls: ToolCall[] = [];
      for (let round = 0; round < MAX_TOOL_ROUNDS && !signal?.aborted; round++) {
        let roundText = '';
        const calls: ToolCall[] = [];
        for await (const chunk of this.llm.streamText({
          system,
          messages: turns,
          tools: CHAT_TOOLS,
          timeoutMs: AI_TIMEOUTS_MS.chat,
        })) {
          if (chunk.type === 'text') {
            roundText += chunk.text;
            yield { type: 'token', text: chunk.text };
          } else {
            calls.push(chunk.call);
          }
        }
        content += roundText;
        if (calls.length === 0) break;

        turns.push({ role: 'assistant', content: roundText, toolCalls: calls });
        for (const call of calls) {
          const outcome = await this.toolbox.execute(user, call);
          toolCalls.push(call);
          cards.push(...outcome.cards);
          for (const card of outcome.cards) yield { type: 'card', card };
          turns.push({
            role: 'tool',
            toolCallId: call.id,
            name: call.name,
            content: outcome.result,
          });
        }
      }

      if (!content) {
        content = FALLBACK_REPLY;
        yield { type: 'token', text: content };
      }
      const saved = await this.tx.run(async () => {
        await this.messages.create(user.id, {
          role: 'user',
          content: message,
          cards: [],
          toolCalls: [],
          createdAt: startedAt,
        });
        return this.messages.create(user.id, {
          role: 'assistant',
          content,
          cards,
          toolCalls,
          createdAt: this.clock.now(),
        });
      });
      yield { type: 'done', messageId: saved.id };
    } catch (error) {
      if (error instanceof AiUnavailableError) {
        yield {
          type: 'error',
          code: 'ai_unavailable',
          message: "I can't reply right now. Try again in a minute.",
        };
        return;
      }
      this.logger.error({ event: 'chat_failed', error: String(error) });
      yield { type: 'error', code: 'internal_error', message: 'Something went wrong. Try again.' };
    }
  }
}
