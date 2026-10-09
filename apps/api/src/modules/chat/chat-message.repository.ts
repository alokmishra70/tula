import { Injectable } from '@nestjs/common';
import type { ChatCard, ChatMessage, ChatRole } from '@tula/shared';
import type { ChatMessage as ChatRow, Prisma } from '../../generated/prisma/client';
import type { ToolCall } from '../../ai/llm-provider';
import { DbContext } from '../../infrastructure/database/db-context';

export interface NewChatMessage {
  role: ChatRole;
  content: string;
  cards: ChatCard[];
  toolCalls: ToolCall[];
  createdAt: Date;
}

export abstract class ChatMessageRepository {
  /** Most recent messages, returned oldest first. */
  abstract recent(userId: string, limit: number): Promise<ChatMessage[]>;
  abstract create(userId: string, message: NewChatMessage): Promise<ChatMessage>;
}

const toDto = (row: ChatRow): ChatMessage => ({
  id: row.id,
  role: row.role,
  content: row.content,
  cards: (row.cards as ChatCard[] | null) ?? [],
  createdAt: row.createdAt.toISOString(),
});

@Injectable()
export class PrismaChatMessageRepository extends ChatMessageRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async recent(userId: string, limit: number): Promise<ChatMessage[]> {
    const rows = await this.db.client.chatMessage.findMany({
      where: { userId },
      // Role breaks ties within one exchange (enum order: user before assistant).
      orderBy: [{ createdAt: 'desc' }, { role: 'desc' }],
      take: limit,
    });
    return rows.reverse().map(toDto);
  }

  async create(
    userId: string,
    { role, content, cards, toolCalls, createdAt }: NewChatMessage,
  ): Promise<ChatMessage> {
    const row = await this.db.client.chatMessage.create({
      data: {
        userId,
        role,
        content,
        createdAt,
        cards: cards.length ? (cards as unknown as Prisma.InputJsonValue) : undefined,
        toolCalls: toolCalls.length ? (toolCalls as unknown as Prisma.InputJsonValue) : undefined,
      },
    });
    return toDto(row);
  }
}
