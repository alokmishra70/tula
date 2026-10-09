import { recordedEvents, track } from './analytics';

describe('analytics', () => {
  it('records events locally without losing concurrent writes', async () => {
    await Promise.all([
      track({ name: 'meal_logged', props: { source: 'photo', secondsToLog: 8, itemCount: 3 } }),
      track({ name: 'nudge_acted', props: { rule: 'protein_gap' } }),
    ]);
    const events = await recordedEvents();
    expect(events.map((e) => e.name)).toEqual(['meal_logged', 'nudge_acted']);
    expect(events[0]?.at).toEqual(expect.any(String));
  });
});
