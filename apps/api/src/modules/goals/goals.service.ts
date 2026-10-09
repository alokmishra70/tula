import { Injectable, Logger } from '@nestjs/common';
import type { Plan, PlanRequest, Targets } from '@tula/shared';
import { AI_TIMEOUTS_MS } from '../../ai/ai.constants';
import { LlmProvider } from '../../ai/llm-provider';
import { planReasoningInputs, planReasoningPrompt } from '../../ai/prompts';
import { Clock } from '../../common/clock';
import { AppException } from '../../common/errors/app.exception';
import { getMarkerDefinition, isFlagged } from '../../domain/biomarkers';
import { buildTargets, projectGoalDate, type GoalInput } from '../../domain/nutrition';
import { toLocalDate } from '../../domain/time';
import { TransactionManager } from '../../infrastructure/database/transaction-manager';
import { MarkerQueryService } from '../markers/marker-query.service';
import { ProfileService } from '../profile/profile.service';
import { GoalRepository, type GoalRecord } from './goal.repository';
import { fallbackPlanReasoning, type PlanFacts } from './plan-reasoning';

@Injectable()
export class GoalsService {
  private readonly logger = new Logger(GoalsService.name);

  constructor(
    private readonly goals: GoalRepository,
    private readonly profiles: ProfileService,
    private readonly markers: MarkerQueryService,
    private readonly llm: LlmProvider,
    private readonly tx: TransactionManager,
    private readonly clock: Clock,
  ) {}

  async createPlan(userId: string, request: PlanRequest): Promise<Plan> {
    const goal: GoalInput = {
      type: request.goalType,
      targetWeightKg: request.targetWeightKg ?? null,
    };
    const body = await this.profiles.bodyProfile(userId);
    this.assertTargetDirection(goal, body.weightKg);
    return this.toPlan(await this.computeAndStore(userId, goal));
  }

  async activePlan(userId: string): Promise<Plan> {
    const goal = await this.goals.findActive(userId);
    if (!goal) throw AppException.notFound('Plan');
    return this.toPlan(goal);
  }

  async activeTargets(userId: string): Promise<Targets | null> {
    return (await this.goals.findActive(userId))?.targets ?? null;
  }

  /** Re-runs the active plan after lab markers change; no-op when targets stay the same. */
  async refreshAfterMarkerChange(userId: string): Promise<void> {
    const active = await this.goals.findActive(userId);
    if (!active) return;
    const goal = { type: active.type, targetWeightKg: active.targetWeightKg };
    const body = await this.profiles.bodyProfile(userId);
    const next = buildTargets(body, goal, await this.markers.signals(userId));
    if (JSON.stringify(next.targets) === JSON.stringify(active.targets)) return;
    await this.computeAndStore(userId, goal);
  }

  private async computeAndStore(userId: string, goal: GoalInput): Promise<GoalRecord> {
    const body = await this.profiles.bodyProfile(userId);
    const readings = await this.markers.latestReadings(userId);
    const plan = buildTargets(body, goal, readings);
    const today = toLocalDate(this.clock.now(), body.timezone);
    const projection = projectGoalDate(
      body.weightKg,
      plan.targetWeightKg,
      plan.dailyEnergyDelta,
      today,
    );

    const reasoning = await this.writeReasoning({
      name: body.name,
      goalType: goal.type,
      targets: plan.targets,
      dailyEnergyDelta: plan.dailyEnergyDelta,
      currentWeightKg: body.weightKg,
      targetWeightKg: plan.targetWeightKg,
      projectedDate: projection.projectedDate,
      adjustments: plan.adjustments,
      flaggedMarkers: readings
        .filter((reading) => isFlagged(reading.status))
        .map((reading) => ({
          code: reading.code,
          label: getMarkerDefinition(reading.code).label,
          value: reading.normalizedValue,
          unit: reading.canonicalUnit ?? reading.unit,
          status: reading.status,
        })),
    });

    return this.tx.run(() =>
      this.goals.replaceActive(userId, {
        type: goal.type,
        targets: plan.targets,
        startWeightKg: body.weightKg,
        targetWeightKg: plan.targetWeightKg,
        weeklyChangeKg: projection.weeklyChangeKg,
        projectedDate: projection.projectedDate,
        adjustments: plan.adjustments,
        foodSuggestions: plan.foodSuggestions,
        reasoning,
      }),
    );
  }

  private async writeReasoning(facts: PlanFacts): Promise<string> {
    try {
      const { reasoning } = await this.llm.generateStructured({
        prompt: planReasoningPrompt,
        inputs: planReasoningInputs({ ...facts }),
        timeoutMs: AI_TIMEOUTS_MS.copy,
      });
      return reasoning;
    } catch (error) {
      this.logger.warn({ event: 'plan_reasoning_fallback', error: String(error) });
      return fallbackPlanReasoning(facts);
    }
  }

  private assertTargetDirection({ type, targetWeightKg }: GoalInput, currentKg: number): void {
    if (targetWeightKg === null) return;
    const invalid =
      (type === 'lose_weight' && targetWeightKg >= currentKg) ||
      (type === 'build_muscle' && targetWeightKg <= currentKg);
    if (invalid) {
      const direction = type === 'lose_weight' ? 'below' : 'above';
      throw AppException.validation([
        {
          path: 'targetWeightKg',
          message: `Target weight should be ${direction} your current ${currentKg} kg`,
        },
      ]);
    }
  }

  private toPlan(goal: GoalRecord): Plan {
    return {
      goalId: goal.id,
      goalType: goal.type,
      targets: goal.targets,
      projection: {
        startWeightKg: goal.startWeightKg,
        targetWeightKg: goal.targetWeightKg,
        weeklyChangeKg: goal.weeklyChangeKg,
        projectedDate: goal.projectedDate,
      },
      adjustments: goal.adjustments,
      foodSuggestions: goal.foodSuggestions,
      reasoning: goal.reasoning,
    };
  }
}
