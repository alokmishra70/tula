import type { GoalType, MealSource, NudgeRule } from '@tula/shared';
import { readJson, writeJson } from './storage';

export type AnalyticsEvent =
  | {
      name: 'onboarding_completed';
      props: { seconds: number; goal: GoalType; withReport: boolean };
    }
  | { name: 'meal_logged'; props: { source: MealSource; secondsToLog: number; itemCount: number } }
  | { name: 'item_edited'; props: { change: 'quantity' | 'removed' | 'added' | 'clarified' } }
  | { name: 'nudge_acted'; props: { rule: NudgeRule } }
  | { name: 'nudge_dismissed'; props: { rule: NudgeRule } }
  | { name: 'report_uploaded'; props: { fileType: 'pdf' | 'image' } };

export type RecordedEvent = AnalyticsEvent & { at: string };

const KEY = 'tula.analytics';
const MAX_EVENTS = 500;
let queue: Promise<void> = Promise.resolve();

/**
 * Local-only instrumentation for the success metrics. Writes are serialised so
 * events fired together don't overwrite each other.
 */
export function track(event: AnalyticsEvent): Promise<void> {
  queue = queue.then(async () => {
    const events = (await readJson<RecordedEvent[]>(KEY)) ?? [];
    events.push({ ...event, at: new Date().toISOString() });
    await writeJson(KEY, events.slice(-MAX_EVENTS));
  });
  return queue;
}

export async function recordedEvents(): Promise<RecordedEvent[]> {
  await queue;
  return (await readJson<RecordedEvent[]>(KEY)) ?? [];
}
