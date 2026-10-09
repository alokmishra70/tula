import { Injectable } from '@nestjs/common';
import type { MealType, Nudge, NudgeAction, NudgeRule } from '@tula/shared';
import type { Nudge as NudgeRow } from '../../generated/prisma/client';
import { DbContext } from '../../infrastructure/database/db-context';

export interface NudgeRecord extends Nudge {
  shownAt: Date;
  resolved: boolean;
}

export interface NewNudge {
  rule: NudgeRule;
  message: string;
  action: NudgeAction;
  mealType: MealType | null;
  shownAt: Date;
}

export abstract class NudgeRepository {
  abstract shownSince(userId: string, since: Date): Promise<NudgeRecord[]>;
  abstract create(
    userId: string,
    nudge: NewNudge,
    actionLabel: string | null,
  ): Promise<NudgeRecord>;
  /** Returns false when the nudge doesn't belong to the user. */
  abstract resolve(
    userId: string,
    id: string,
    how: 'acted' | 'dismissed',
    at: Date,
  ): Promise<boolean>;
}

// The label is derived, not stored; keep it stable for replays.
const ACTION_LABELS: Record<NudgeAction, (mealType: MealType | null) => string | null> = {
  log_meal: (mealType) => (mealType ? `Log ${mealType}` : 'Log a meal'),
  open_reports: () => 'Open reports',
  none: () => null,
};

const toRecord = (row: NudgeRow, actionLabel?: string | null): NudgeRecord => ({
  id: row.id,
  rule: row.rule,
  message: row.message,
  action: row.action as NudgeAction,
  actionLabel: actionLabel ?? ACTION_LABELS[row.action as NudgeAction](row.mealType),
  mealType: row.mealType,
  shownAt: row.shownAt,
  resolved: row.actedAt !== null || row.dismissedAt !== null,
});

@Injectable()
export class PrismaNudgeRepository extends NudgeRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async shownSince(userId: string, since: Date): Promise<NudgeRecord[]> {
    const rows = await this.db.client.nudge.findMany({
      where: { userId, shownAt: { gte: since } },
      orderBy: { shownAt: 'desc' },
    });
    return rows.map((row) => toRecord(row));
  }

  async create(userId: string, nudge: NewNudge, actionLabel: string | null): Promise<NudgeRecord> {
    return toRecord(await this.db.client.nudge.create({ data: { userId, ...nudge } }), actionLabel);
  }

  async resolve(
    userId: string,
    id: string,
    how: 'acted' | 'dismissed',
    at: Date,
  ): Promise<boolean> {
    const { count } = await this.db.client.nudge.updateMany({
      where: { id, userId },
      data: how === 'acted' ? { actedAt: at } : { dismissedAt: at },
    });
    return count > 0;
  }
}
