import { Injectable } from '@nestjs/common';
import type { DailySummary, TodayResponse } from '@tula/shared';
import type { RequestUser } from '../../common/auth/request-user';
import { Clock } from '../../common/clock';
import { AppException } from '../../common/errors/app.exception';
import { isFlagged } from '../../domain/biomarkers';
import { computeStreak } from '../../domain/streaks';
import { addDays, localClock, type IsoDate } from '../../domain/time';
import { GoalsService } from '../goals/goals.service';
import { MarkerQueryService } from '../markers/marker-query.service';
import { MealsService } from '../meals/meals.service';
import { emptySummary, SummaryService } from '../meals/summary.service';
import { NudgeService } from '../nudges/nudge.service';
import { ProfileService } from '../profile/profile.service';

const STREAK_LOOKBACK_DAYS = 120;
const WEEK_DAYS = 7;

@Injectable()
export class TodayService {
  constructor(
    private readonly profiles: ProfileService,
    private readonly goals: GoalsService,
    private readonly meals: MealsService,
    private readonly summaries: SummaryService,
    private readonly markers: MarkerQueryService,
    private readonly nudges: NudgeService,
    private readonly clock: Clock,
  ) {}

  async get(user: RequestUser, requestedDate?: IsoDate): Promise<TodayResponse> {
    const clock = localClock(this.clock.now(), user.timezone);
    const date = requestedDate ?? clock.date;
    if (date > clock.date)
      throw AppException.validation([{ path: 'date', message: 'Date is in the future' }]);

    const [profile, targets, meals, history, flaggedMarkers, hasEverLogged] = await Promise.all([
      this.profiles.get(user.id),
      this.goals.activeTargets(user.id),
      this.meals.listForDate(user.id, date),
      this.summaries.range(user.id, addDays(date, -STREAK_LOOKBACK_DAYS), date),
      this.markers.highlights(user.id),
      this.meals.hasEverLogged(user.id),
    ]);
    if (!targets) throw AppException.notFound('Plan');

    const byDate = new Map(history.map((summary) => [summary.date, summary]));
    const summary = byDate.get(date) ?? emptySummary(date);
    const streak = computeStreak(new Map(history.map((s) => [s.date, s.mealsCount])), date);

    const nudge =
      date === clock.date
        ? await this.nudges.current(user.id, {
            clock,
            targets,
            consumed: summary.consumed,
            loggedMealTypes: new Set(meals.map((meal) => meal.mealType)),
            hasEverLogged,
            onTarget: summary.onTarget,
            streakDays: streak.current,
            flaggedMarkers: new Set(
              flaggedMarkers.filter((m) => isFlagged(m.status)).map((m) => m.code),
            ),
          })
        : null;

    return {
      date,
      name: profile.name,
      targets,
      summary,
      meals,
      nudge,
      streak,
      flaggedMarkers,
      week: this.week(byDate, date),
    };
  }

  private week(byDate: Map<IsoDate, DailySummary>, endDate: IsoDate): TodayResponse['week'] {
    return Array.from({ length: WEEK_DAYS }, (_, index) => {
      const date = addDays(endDate, index - (WEEK_DAYS - 1));
      const summary = byDate.get(date);
      return { date, onTarget: summary && summary.mealsCount > 0 ? summary.onTarget : null };
    });
  }
}
