import { formatNumber, type NudgeContext, type NudgeProposal, type NudgeRule } from '../nudge-rule';

const FROM_HOUR = 17;
const UNTIL_HOUR = 21;
const MIN_ROOM_KCAL = 300;
const THALI_KCAL = 600;

export class CalorieRoomRule implements NudgeRule {
  readonly id = 'calorie_room';
  readonly priority = 40;

  evaluate({ clock, consumed, targets, loggedMealTypes }: NudgeContext): NudgeProposal | null {
    if (clock.hour < FROM_HOUR || clock.hour >= UNTIL_HOUR) return null;
    if (loggedMealTypes.has('dinner')) return null;
    const roomKcal = targets.kcal - consumed.kcal;
    if (roomKcal < MIN_ROOM_KCAL) return null;
    const fits = roomKcal >= THALI_KCAL ? 'A normal thali fits.' : 'A light dinner fits.';
    return {
      action: 'log_meal',
      actionLabel: 'Log dinner',
      mealType: 'dinner',
      facts: { kcalLeft: formatNumber(roomKcal) },
      fallbackMessage: `${formatNumber(roomKcal)} kcal left. ${fits}`,
    };
  }
}
