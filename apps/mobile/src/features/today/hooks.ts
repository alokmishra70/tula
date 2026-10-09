import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Nudge, TodayResponse } from '@tula/shared';
import { track } from '@/lib/analytics';
import { queryKeys } from '@/lib/query-keys';
import { todayApi } from './api';

export function useToday(date: string) {
  return useQuery({
    queryKey: queryKeys.today(date),
    queryFn: () => todayApi.get(date),
    placeholderData: keepPreviousData,
  });
}

/** Records the outcome and hides the card at once; the server keeps the nudge history for metrics. */
export function useNudgeFeedback(date: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ nudge, how }: { nudge: Nudge; how: 'act' | 'dismiss' }) =>
      how === 'act' ? todayApi.act(nudge.id) : todayApi.dismiss(nudge.id),
    onMutate: ({ nudge, how }) => {
      void track({
        name: how === 'act' ? 'nudge_acted' : 'nudge_dismissed',
        props: { rule: nudge.rule },
      });
      client.setQueryData<TodayResponse>(
        queryKeys.today(date),
        (today) => today && { ...today, nudge: null },
      );
    },
  });
}
