import { Injectable } from '@nestjs/common';
import type { GoalType, PlanAdjustment, Targets } from '@tula/shared';
import type { Goal } from '../../generated/prisma/client';
import { DbContext } from '../../infrastructure/database/db-context';
import type { IsoDate } from '../../domain/time';

export interface GoalRecord {
  id: string;
  type: GoalType;
  targets: Targets;
  startWeightKg: number;
  targetWeightKg: number | null;
  weeklyChangeKg: number;
  projectedDate: IsoDate | null;
  adjustments: PlanAdjustment[];
  foodSuggestions: string[];
  reasoning: string;
}

export type NewGoal = Omit<GoalRecord, 'id'>;

export abstract class GoalRepository {
  abstract findActive(userId: string): Promise<GoalRecord | null>;
  /** Deactivates the current goal and stores the new one; call inside a transaction. */
  abstract replaceActive(userId: string, goal: NewGoal): Promise<GoalRecord>;
}

const toRecord = (row: Goal): GoalRecord => ({
  id: row.id,
  type: row.type,
  targets: {
    kcal: row.kcalTarget,
    proteinG: row.proteinG,
    carbsG: row.carbsG,
    fatG: row.fatG,
    fiberG: row.fiberG,
    waterMl: row.waterMl,
    saturatedFatMaxG: row.saturatedFatMaxG,
    addedSugarMaxG: row.addedSugarMaxG,
  },
  startWeightKg: row.startWeightKg,
  targetWeightKg: row.targetWeightKg,
  weeklyChangeKg: row.weeklyChangeKg,
  projectedDate: row.projectedDate?.toISOString().slice(0, 10) ?? null,
  adjustments: row.adjustments as PlanAdjustment[],
  foodSuggestions: row.foodSuggestions,
  reasoning: row.reasoning,
});

@Injectable()
export class PrismaGoalRepository extends GoalRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async findActive(userId: string): Promise<GoalRecord | null> {
    const row = await this.db.client.goal.findFirst({ where: { userId, active: true } });
    return row && toRecord(row);
  }

  async replaceActive(userId: string, goal: NewGoal): Promise<GoalRecord> {
    const { targets } = goal;
    await this.db.client.goal.updateMany({
      where: { userId, active: true },
      data: { active: false },
    });
    const row = await this.db.client.goal.create({
      data: {
        userId,
        type: goal.type,
        startWeightKg: goal.startWeightKg,
        targetWeightKg: goal.targetWeightKg,
        kcalTarget: targets.kcal,
        proteinG: targets.proteinG,
        carbsG: targets.carbsG,
        fatG: targets.fatG,
        fiberG: targets.fiberG,
        waterMl: targets.waterMl,
        saturatedFatMaxG: targets.saturatedFatMaxG,
        addedSugarMaxG: targets.addedSugarMaxG,
        weeklyChangeKg: goal.weeklyChangeKg,
        projectedDate: goal.projectedDate ? new Date(`${goal.projectedDate}T00:00:00Z`) : null,
        adjustments: goal.adjustments,
        foodSuggestions: goal.foodSuggestions,
        reasoning: goal.reasoning,
      },
    });
    return toRecord(row);
  }
}
