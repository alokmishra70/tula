import { onlineManager, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ChatMessageSchema,
  ChatStreamEventSchema,
  type ChatCard,
  type ChatMessage,
} from '@tula/shared';
import { randomUUID } from 'expo-crypto';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';
import { api } from '@/lib/api';
import { ApiError } from '@/lib/api-client';
import { queryKeys } from '@/lib/query-keys';
import { streamPost } from '@/lib/stream';

export interface ChatEntry {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  cards: ChatCard[];
  streaming: boolean;
}

const OFFLINE = "You're offline. Your message is still here.";

const fromHistory = (message: ChatMessage): ChatEntry => ({ ...message, streaming: false });

/** Streams replies; a failed send restores the text to the composer so nothing is lost. */
export function useChat() {
  const client = useQueryClient();
  const history = useQuery({
    queryKey: queryKeys.chatHistory,
    queryFn: () => api.get('/chat/messages', { schema: z.array(ChatMessageSchema) }),
    staleTime: Infinity,
  });
  const [session, setSession] = useState<ChatEntry[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const abort = useRef<AbortController | null>(null);

  useEffect(() => () => abort.current?.abort(), []);

  const patchReply = (id: string, change: (entry: ChatEntry) => ChatEntry) =>
    setSession((entries) => entries.map((entry) => (entry.id === id ? change(entry) : entry)));

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    if (!onlineManager.isOnline()) {
      setDraft(message);
      setError(OFFLINE);
      return;
    }
    const userEntry: ChatEntry = {
      id: randomUUID(),
      role: 'user',
      content: message,
      cards: [],
      streaming: false,
    };
    const reply: ChatEntry = {
      id: randomUUID(),
      role: 'assistant',
      content: '',
      cards: [],
      streaming: true,
    };
    setSession((entries) => [...entries, userEntry, reply]);
    setDraft('');
    setError(null);
    setSending(true);
    abort.current = new AbortController();

    try {
      await streamPost(
        '/chat',
        { message },
        (data) => {
          const event = ChatStreamEventSchema.parse(JSON.parse(data));
          if (event.type === 'token')
            patchReply(reply.id, (e) => ({ ...e, content: e.content + event.text }));
          if (event.type === 'card') {
            patchReply(reply.id, (e) => ({ ...e, cards: [...e.cards, event.card] }));
            if (event.card.type === 'meal')
              void client.invalidateQueries({ queryKey: queryKeys.todayAll });
          }
          if (event.type === 'error') throw new ApiError(event.code, event.message, 503);
        },
        abort.current.signal,
      );
      patchReply(reply.id, (e) => ({ ...e, streaming: false }));
    } catch (caught) {
      if ((caught as Error).name === 'AbortError') return;
      setSession((entries) => entries.filter((e) => e.id !== userEntry.id && e.id !== reply.id));
      setDraft(message);
      setError(
        caught instanceof ApiError && caught.isOffline
          ? OFFLINE
          : "Tula couldn't reply. Try again.",
      );
    } finally {
      setSending(false);
    }
  };

  return {
    entries: [...(history.data ?? []).map(fromHistory), ...session],
    loading: history.isPending,
    draft,
    setDraft,
    error,
    sending,
    send,
  };
}
