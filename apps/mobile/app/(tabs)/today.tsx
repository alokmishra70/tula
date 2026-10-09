import type { FlaggedMarker, Nudge } from '@tula/shared';
import { useRouter } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { retryFailed, useDeleteMealWithUndo, useLogFlow, useOutboxStore } from '@/features/meals';
import {
  ImprovedMarkers,
  MarkersStrip,
  MealsTimeline,
  Milestone,
  RingCard,
  TodayHeader,
  TodaySkeleton,
  useNudgeFeedback,
  useToday,
  WeekStrip,
} from '@/features/today';
import { localIsoDate } from '@/lib/dates';
import { layout, spacing } from '@/theme';
import { Button, Card, EmptyState, NudgeCard, Screen, Text } from '@/ui';

const SIDE_COLUMN_MIN_WIDTH =
  layout.sidebarWidth + layout.contentMaxWidth + layout.sideColumnWidth + spacing.xxxl;

export default function TodayScreen() {
  const router = useRouter();
  const date = localIsoDate();
  const today = useToday(date);
  const feedback = useNudgeFeedback(date);
  const { openLog, openEdit } = useLogFlow();
  const deleteMeal = useDeleteMealWithUndo();
  const failedSyncs = useOutboxStore(
    (state) => state.items.filter((item) => item.state === 'failed').length,
  );
  const wide = useWindowDimensions().width >= SIDE_COLUMN_MIN_WIDTH;

  if (today.isPending) {
    return (
      <Screen>
        <TodaySkeleton />
      </Screen>
    );
  }

  if (!today.data) {
    return (
      <Screen>
        <EmptyState
          illustration="katori"
          message="Couldn't load today. Check your connection."
          action={{ label: 'Try again', onPress: () => void today.refetch() }}
        />
      </Screen>
    );
  }

  const data = today.data;
  const onNudge = (nudge: Nudge) => {
    feedback.mutate({ nudge, how: 'act' });
    if (nudge.action === 'log_meal') openLog(nudge.mealType ?? undefined);
    if (nudge.action === 'open_reports') router.push('/reports');
  };
  const openMarker = (marker: FlaggedMarker) =>
    router.push({
      pathname: '/reports/[id]',
      params: { id: marker.reportId, marker: marker.code },
    });

  const side = (
    <>
      <WeekStrip week={data.week} />
      <ImprovedMarkers markers={data.flaggedMarkers} />
    </>
  );

  return (
    <Screen
      onRefresh={() => void today.refetch()}
      refreshing={today.isRefetching}
      aside={wide ? side : undefined}
    >
      <TodayHeader
        date={data.date}
        name={data.name}
        targetKcal={data.targets.kcal}
        consumedKcal={data.summary.consumed.kcal}
        streak={data.streak.current}
        onOpenPlan={() => router.push('/plan')}
      />
      {failedSyncs > 0 ? (
        <Card variant="sunken">
          <Text variant="body">
            {failedSyncs === 1 ? "1 meal couldn't sync." : `${failedSyncs} meals couldn't sync.`}
          </Text>
          <Button label="Retry" variant="ghost" onPress={() => void retryFailed()} />
        </Card>
      ) : null}
      <RingCard summary={data.summary} targets={data.targets} />
      {data.nudge ? (
        <NudgeCard
          message={data.nudge.message}
          actionLabel={data.nudge.actionLabel}
          onAction={() => onNudge(data.nudge!)}
          onDismiss={() => feedback.mutate({ nudge: data.nudge!, how: 'dismiss' })}
        />
      ) : null}
      <MealsTimeline
        meals={data.meals}
        onAdd={(mealType) => openLog(mealType)}
        onOpen={openEdit}
        onDelete={deleteMeal}
      />
      <MarkersStrip markers={data.flaggedMarkers} onOpen={openMarker} />
      {wide ? null : side}
      <Milestone days={data.streak.milestoneReached} date={data.date} />
    </Screen>
  );
}
