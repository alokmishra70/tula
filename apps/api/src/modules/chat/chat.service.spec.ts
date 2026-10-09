import type { ChatMessage, ChatStreamEvent } from '@tula/shared';
import { AiUnavailableError } from '../../ai/llm-errors';
import { LlmProvider, type LlmChatChunk, type LlmChatRequest } from '../../ai/llm-provider';
import type { Clock } from '../../common/clock';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import type { ProfileService } from '../profile/profile.service';
import { ChatMessageRepository, type NewChatMessage } from './chat-message.repository';
import type { ChatToolbox } from './chat-tools';
import { ChatService } from './chat.service';

/** Replies with one scripted round per call and records what it was sent. */
class RoundsProvider extends LlmProvider {
  readonly name = 'rounds';
  readonly requests: LlmChatRequest[] = [];
  constructor(private readonly rounds: Array<LlmChatChunk[] | Error>) {
    super();
  }
  async generateStructured<T>(): Promise<T> {
    throw new Error('unused');
  }
  async *streamText(request: LlmChatRequest): AsyncIterable<LlmChatChunk> {
    this.requests.push(structuredClone(request));
    const round = this.rounds.shift() ?? [];
    if (round instanceof Error) throw round;
    yield* round;
  }
}

class MemoryMessages extends ChatMessageRepository {
  readonly saved: NewChatMessage[] = [];
  async recent(): Promise<ChatMessage[]> {
    return [
      {
        id: 'm0',
        role: 'user',
        content: 'Earlier question',
        cards: [],
        createdAt: '2026-10-08T00:00:00Z',
      },
    ];
  }
  async create(_userId: string, message: NewChatMessage): Promise<ChatMessage> {
    this.saved.push(message);
    return { id: `m${this.saved.length}`, ...message, createdAt: message.createdAt.toISOString() };
  }
}

class InlineTx extends TransactionManager {
  run<T>(work: () => Promise<T>) {
    return work();
  }
}

const user = { id: 'u1', deviceId: 'd1', timezone: 'Asia/Kolkata' };
const profiles = { get: async () => ({ name: 'Rohan' }) } as unknown as ProfileService;
const clock: Clock = { now: () => new Date('2026-10-08T13:00:00Z') };
const dayCard = {
  type: 'day' as const,
  consumed: { kcal: 1200, proteinG: 50, carbsG: 0, fatG: 0, fiberG: 0 },
  targetKcal: 1850,
};
const toolbox = {
  execute: jest.fn(async () => ({ result: '{"kcalRemaining":650}', cards: [dayCard] })),
} as unknown as ChatToolbox;

async function collect(stream: AsyncIterable<ChatStreamEvent>) {
  const events: ChatStreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe('ChatService', () => {
  it('runs requested tools, streams cards and tokens, then stores both messages', async () => {
    const llm = new RoundsProvider([
      [{ type: 'tool_call', call: { id: 'c1', name: 'get_today_summary', arguments: {} } }],
      [
        { type: 'text', text: '650 kcal ' },
        { type: 'text', text: 'left today.' },
      ],
    ]);
    const messages = new MemoryMessages();
    const service = new ChatService(messages, toolbox, profiles, llm, new InlineTx(), clock);

    const events = await collect(service.reply(user, 'How am I doing?'));

    expect(events).toEqual([
      { type: 'card', card: dayCard },
      { type: 'token', text: '650 kcal ' },
      { type: 'token', text: 'left today.' },
      { type: 'done', messageId: 'm2' },
    ]);
    expect(llm.requests[0]?.system).toContain('Rohan');
    expect(llm.requests[0]?.messages.map((m) => m.role)).toEqual(['user', 'user']);
    expect(llm.requests[1]?.messages.at(-1)).toMatchObject({
      role: 'tool',
      toolCallId: 'c1',
      content: '{"kcalRemaining":650}',
    });
    expect(messages.saved.map((m) => [m.role, m.content])).toEqual([
      ['user', 'How am I doing?'],
      ['assistant', '650 kcal left today.'],
    ]);
    expect(messages.saved[1]?.cards).toEqual([dayCard]);
  });

  it('reports unavailability without storing anything, so the user can retry', async () => {
    const messages = new MemoryMessages();
    const service = new ChatService(
      messages,
      toolbox,
      profiles,
      new RoundsProvider([new AiUnavailableError([])]),
      new InlineTx(),
      clock,
    );
    const events = await collect(service.reply(user, 'hello'));
    expect(events).toEqual([expect.objectContaining({ type: 'error', code: 'ai_unavailable' })]);
    expect(messages.saved).toEqual([]);
  });

  it('stops after the tool round limit', async () => {
    const call = {
      type: 'tool_call' as const,
      call: { id: 'c', name: 'get_week_history', arguments: {} },
    };
    const llm = new RoundsProvider([[call], [call], [call], [call]]);
    const service = new ChatService(
      new MemoryMessages(),
      toolbox,
      profiles,
      llm,
      new InlineTx(),
      clock,
    );
    const events = await collect(service.reply(user, 'loop'));
    expect(llm.requests).toHaveLength(3);
    expect(events.at(-1)).toMatchObject({ type: 'done' });
  });
});
