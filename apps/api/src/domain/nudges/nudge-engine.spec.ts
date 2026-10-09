import type { MarkerCode, MealType, Targets } from '@tula/shared';
import { NudgeEngine, NUDGE_COOLDOWN_MS, type NudgeHistoryEntry } from './nudge-engine';
import type { NudgeContext } from './nudge-rule';
import { DEFAULT_NUDGE_RULES } from './rules';

const targets: Targets = {
  kcal: 1800,
  proteinG: 90,
  carbsG: 200,
  fatG: 60,
  fiberG: 30,
  waterMl: 2800,
  saturatedFatMaxG: null,
  addedSugarMaxG: null,
};

function context(
  overrides: Partial<NudgeContext> & { at?: string; meals?: MealType[]; flags?: MarkerCode[] } = {},
): NudgeContext {
  const [hour, minute] = (overrides.at ?? '12:00').split(':').map(Number) as [number, number];
  return {
    clock: { date: '2026-10-08', hour, minute },
    targets,
    consumed: { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, fiberG: 0 },
    loggedMealTypes: new Set(overrides.meals ?? []),
    hasEverLogged: true,
    onTarget: false,
    streakDays: 0,
    flaggedMarkers: new Set(overrides.flags ?? []),
    ...overrides,
  };
}

const now = new Date('2026-10-08T12:00:00Z');
const engine = new NudgeEngine(DEFAULT_NUDGE_RULES);
const pick = (ctx: NudgeContext, history: NudgeHistoryEntry[] = []) =>
  engine.select(ctx, history, now);

describe('nudge rules', () => {
  it('asks a brand new user for their first meal', () => {
    expect(pick(context({ hasEverLogged: false, at: '14:00' }))?.rule).toBe('first_meal');
  });

  it('reminds about a missed lunch after 1:30 pm', () => {
    const nudge = pick(context({ at: '13:45', meals: ['breakfast'] }));
    expect(nudge).toMatchObject({ rule: 'missing_meal', mealType: 'lunch' });
    expect(nudge?.fallbackMessage).toBe('Lunch not logged yet. Snap it now?');
  });

  it('does not nag about breakfast once lunch is logged', () => {
    expect(pick(context({ at: '12:30', meals: ['lunch'] }))).toBeNull();
  });

  it('flags a protein gap after 4 pm', () => {
    const nudge = pick(
      context({
        at: '16:30',
        meals: ['breakfast', 'lunch'],
        consumed: { kcal: 1000, proteinG: 40, carbsG: 0, fatG: 0, fiberG: 20 },
      }),
    );
    expect(nudge?.rule).toBe('protein_gap');
    expect(nudge?.fallbackMessage).toBe('50 g protein to go. Curd or roasted chana would help.');
  });

  it('prioritises fibre for LDL users in the evening', () => {
    const nudge = pick(
      context({
        at: '18:30',
        meals: ['breakfast', 'lunch'],
        flags: ['ldl'],
        consumed: { kcal: 1000, proteinG: 30, carbsG: 0, fatG: 0, fiberG: 10 },
      }),
    );
    expect(nudge?.rule).toBe('fiber_gap');
  });

  it('shows calorie room before dinner', () => {
    const nudge = pick(
      context({
        at: '19:00',
        meals: ['breakfast', 'lunch'],
        consumed: { kcal: 1180, proteinG: 60, carbsG: 0, fatG: 0, fiberG: 25 },
      }),
    );
    expect(nudge?.fallbackMessage).toBe('620 kcal left. A normal thali fits.');
  });

  it('protects a streak at 8 pm', () => {
    const nudge = pick(context({ at: '20:15', meals: ['breakfast'], streakDays: 5 }));
    expect(nudge?.rule).toBe('streak_protection');
    expect(nudge?.fallbackMessage).toBe('Log dinner to keep your 5-day streak.');
  });

  it('celebrates a complete day', () => {
    const nudge = pick(
      context({ at: '21:30', meals: ['breakfast', 'lunch', 'dinner'], onTarget: true }),
    );
    expect(nudge).toMatchObject({ rule: 'day_complete', action: 'none' });
  });
});

describe('NudgeEngine', () => {
  const lunchMissed = context({ at: '14:00', meals: ['breakfast'] });
  const ago = (ms: number) => new Date(now.getTime() - ms);

  it('keeps the active nudge while it still applies', () => {
    const history = [
      { rule: 'missing_meal' as const, shownAt: ago(10 * 60 * 1000), resolved: false },
    ];
    expect(pick(lunchMissed, history)?.rule).toBe('missing_meal');
  });

  it('skips rules shown and resolved within the cooldown', () => {
    const history = [
      { rule: 'missing_meal' as const, shownAt: ago(60 * 60 * 1000), resolved: true },
    ];
    expect(pick(lunchMissed, history)).toBeNull();
  });

  it('allows a rule again after the cooldown', () => {
    const history = [
      { rule: 'missing_meal' as const, shownAt: ago(NUDGE_COOLDOWN_MS + 1), resolved: true },
    ];
    expect(pick(lunchMissed, history)?.rule).toBe('missing_meal');
  });

  it('accepts new rules without engine changes', () => {
    const custom = new NudgeEngine([
      {
        id: 'calorie_room',
        priority: 1,
        evaluate: () => ({
          action: 'none',
          actionLabel: null,
          mealType: null,
          facts: {},
          fallbackMessage: 'hi',
        }),
      },
    ]);
    expect(custom.select(context(), [], now)?.fallbackMessage).toBe('hi');
  });
});
