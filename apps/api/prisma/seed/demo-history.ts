import { createHash } from 'node:crypto';
import {
  DEMO_DEVICE_IDS,
  type GoalType,
  type MealType,
  type PortionUnit,
  type Sex,
} from '@tula/shared';
import type { Prisma, PrismaClient } from '../../src/generated/prisma/client';
import {
  explainMarker,
  getMarkerDefinition,
  isFlagged,
  normalizeMarker,
  type RawMarker,
} from '../../src/domain/biomarkers';
import {
  buildTargets,
  isDayOnTarget,
  nutritionForPortion,
  projectGoalDate,
  sumMacros,
  type BodyProfile,
} from '../../src/domain/nutrition';
import { addDays, toLocalDate, type IsoDate } from '../../src/domain/time';
import { fallbackPlanReasoning } from '../../src/modules/goals/plan-reasoning';

type Portion = [dish: string, quantity: number, unit?: PortionUnit];
type DayMenu = Partial<Record<MealType, Portion[]>>;

interface DemoHistory {
  deviceId: string;
  goal: { type: GoalType; targetWeightKg: number | null };
  reports: Array<{ daysAgo: number; labName: string; rows: RawMarker[] }>;
  /** Oldest first, ending today. */
  days: DayMenu[];
}

const MEAL_HOURS: Record<MealType, string> = {
  breakfast: '08:30',
  lunch: '13:15',
  snack: '17:00',
  dinner: '20:45',
};

const row = (
  rawName: string,
  value: number,
  unit: string,
  refLow: number | null,
  refHigh: number | null,
): RawMarker => ({
  rawName,
  value,
  unit,
  refLow,
  refHigh,
});

const ROHAN: DemoHistory = {
  deviceId: DEMO_DEVICE_IDS.rohan,
  goal: { type: 'lose_weight', targetWeightKg: 72 },
  reports: [
    {
      daysAgo: 190,
      labName: 'Thyrocare',
      rows: [
        row('HbA1c', 6.0, '%', 4, 5.6),
        row('LDL Cholesterol', 168, 'mg/dL', null, 130),
        row('HDL Cholesterol', 39, 'mg/dL', 40, null),
      ],
    },
    {
      daysAgo: 37,
      labName: 'Thyrocare',
      rows: [
        row('HbA1c', 5.9, '%', 4, 5.6),
        row('Fasting Blood Sugar', 104, 'mg/dL', 70, 100),
        row('Total Cholesterol', 228, 'mg/dL', null, 200),
        row('LDL Cholesterol', 152, 'mg/dL', null, 130),
        row('HDL Cholesterol', 41, 'mg/dL', 40, null),
        row('Triglycerides', 168, 'mg/dL', null, 150),
        row('Vitamin D (25-OH)', 24, 'ng/mL', 30, 100),
        row('Vitamin B12', 310, 'pg/mL', 200, 900),
        row('Haemoglobin', 14.6, 'g/dL', 13, 17),
      ],
    },
  ],
  days: [
    {
      breakfast: [
        ['Poha', 1],
        ['Masala chai', 1],
      ],
      lunch: [
        ['Roti', 2],
        ['Dal tadka', 1],
        ['Aloo gobi', 1],
      ],
      dinner: [
        ['Chicken curry', 1],
        ['Steamed rice', 1],
      ],
    },
    {
      breakfast: [
        ['Besan chilla', 2],
        ['Masala chai', 1],
      ],
      lunch: [['Veg thali', 1]],
      dinner: [
        ['Roti', 2],
        ['Rajma', 1],
        ['Green salad', 1],
      ],
    },
    {
      lunch: [
        ['Chicken biryani', 1],
        ['Raita', 1],
      ],
    },
    {
      breakfast: [
        ['Idli', 3],
        ['Sambar', 1],
      ],
      lunch: [
        ['Roti', 2],
        ['Palak paneer', 1],
        ['Curd', 1],
      ],
      snack: [['Roasted chana', 1]],
      dinner: [
        ['Moong dal', 1],
        ['Steamed rice', 1],
        ['Bhindi masala', 1],
      ],
    },
    {
      breakfast: [['Oats porridge', 1]],
      lunch: [
        ['Roti', 2],
        ['Chole', 1],
        ['Green salad', 1],
      ],
      dinner: [
        ['Grilled chicken breast', 1],
        ['Mixed veg curry', 1],
        ['Roti', 1],
      ],
    },
    {
      breakfast: [
        ['Poha', 1],
        ['Masala chai', 1],
      ],
      lunch: [
        ['Roti', 2],
        ['Dal tadka', 1],
        ['Aloo sabzi', 1],
        ['Curd', 1],
      ],
      snack: [['Banana', 1]],
      dinner: [
        ['Egg curry', 1],
        ['Roti', 2],
      ],
    },
    {
      breakfast: [
        ['Poha', 1],
        ['Masala chai', 1],
      ],
    },
  ],
};

const PRIYA: DemoHistory = {
  deviceId: DEMO_DEVICE_IDS.priya,
  goal: { type: 'improve_marker', targetWeightKg: null },
  reports: [
    {
      daysAgo: 20,
      labName: 'Dr Lal PathLabs',
      rows: [
        row('TSH', 5.8, 'µIU/mL', 0.4, 4.5),
        row('Vitamin D Total', 14, 'ng/mL', 30, 100),
        row('Vitamin B12', 180, 'pg/mL', 200, 900),
        row('Hemoglobin', 11.6, 'g/dL', 12, 15.5),
        row('Fasting Glucose', 88, 'mg/dL', 70, 100),
      ],
    },
  ],
  days: [
    {
      breakfast: [
        ['Idli', 3],
        ['Sambar', 1],
        ['Filter coffee', 1],
      ],
      lunch: [
        ['Curd rice', 1.5],
        ['Beans poriyal', 1],
      ],
      snack: [
        ['Roasted peanuts', 1],
        ['Masala chai', 1],
      ],
      dinner: [
        ['Roti', 2],
        ['Palak paneer', 1],
      ],
    },
    {
      breakfast: [
        ['Upma', 1],
        ['Filter coffee', 1],
      ],
      lunch: [
        ['Steamed rice', 1],
        ['Sambar', 1],
        ['Beans poriyal', 1],
      ],
      snack: [
        ['Roasted peanuts', 1],
        ['Masala chai', 1],
      ],
      dinner: [
        ['Roti', 2],
        ['Moong dal', 1],
        ['Curd', 1],
      ],
    },
    {
      breakfast: [
        ['Boiled egg', 2],
        ['Brown bread', 2],
      ],
      lunch: [
        ['Veg pulao', 1],
        ['Raita', 1],
      ],
      dinner: [
        ['Khichdi', 1],
        ['Curd', 1],
      ],
    },
    {
      breakfast: [
        ['Idli', 3],
        ['Coconut chutney', 2],
        ['Filter coffee', 1],
      ],
      lunch: [
        ['Roti', 2],
        ['Rajma', 1],
      ],
      snack: [['Guava', 1]],
      dinner: [
        ['Plain dosa', 1],
        ['Sambar', 1],
      ],
    },
    { breakfast: [['Poha', 1]], lunch: [['Curd rice', 1]] },
    {
      breakfast: [
        ['Upma', 1],
        ['Filter coffee', 1],
      ],
      lunch: [
        ['Roti', 2],
        ['Palak paneer', 1],
      ],
      snack: [
        ['Roasted peanuts', 1],
        ['Masala chai', 1],
      ],
      dinner: [
        ['Fish curry', 1],
        ['Steamed rice', 1],
      ],
    },
    {
      breakfast: [
        ['Idli', 3],
        ['Sambar', 1],
      ],
    },
  ],
};

async function resetHistory(prisma: PrismaClient, userId: string): Promise<void> {
  await prisma.$transaction([
    prisma.meal.deleteMany({ where: { userId } }),
    prisma.dailySummary.deleteMany({ where: { userId } }),
    prisma.goal.deleteMany({ where: { userId } }),
    prisma.report.deleteMany({ where: { userId } }),
    prisma.nudge.deleteMany({ where: { userId } }),
    prisma.chatMessage.deleteMany({ where: { userId } }),
  ]);
}

async function seedReports(
  prisma: PrismaClient,
  userId: string,
  sex: Sex,
  history: DemoHistory,
  today: IsoDate,
) {
  for (const report of history.reports) {
    const reportDate = addDays(today, -report.daysAgo);
    const created = await prisma.report.create({
      data: {
        userId,
        fileKey: `report/${userId}/demo-${reportDate}.pdf`,
        fileHash: createHash('sha256').update(`${userId}:${reportDate}`).digest('hex'),
        fileName: `${report.labName} ${reportDate}.pdf`,
        labName: report.labName,
        reportDate: new Date(`${reportDate}T00:00:00Z`),
        status: 'ready',
        createdAt: new Date(`${reportDate}T10:00:00+05:30`),
      },
    });
    await prisma.biomarker.createMany({
      data: report.rows.map((raw) => {
        const marker = normalizeMarker(raw, sex);
        return {
          reportId: created.id,
          userId,
          code: marker.code,
          rawName: raw.rawName,
          value: raw.value,
          unit: raw.unit,
          normalizedValue: marker.normalizedValue,
          canonicalUnit: marker.canonicalUnit,
          refLow: marker.range.low,
          refHigh: marker.range.high,
          status: marker.status,
          needsConfirmation: marker.needsConfirmation,
          explanation: (explainMarker(marker.code, marker.status) ?? undefined) as
            Prisma.InputJsonValue | undefined,
        };
      }),
    });
  }
}

export async function seedDemoHistory(prisma: PrismaClient): Promise<void> {
  const dishes = new Map((await prisma.dishRef.findMany()).map((dish) => [dish.name, dish]));
  const now = new Date();

  for (const history of [ROHAN, PRIYA]) {
    const user = await prisma.user.findUniqueOrThrow({ where: { deviceId: history.deviceId } });
    const weight = await prisma.weightLog.findFirstOrThrow({
      where: { userId: user.id },
      orderBy: { loggedAt: 'desc' },
    });
    const today = toLocalDate(now, user.timezone);
    await resetHistory(prisma, user.id);
    await seedReports(prisma, user.id, user.sex, history, today);

    const latestReport = history.reports.at(-1)!;
    const signals = latestReport.rows
      .map((raw) => normalizeMarker(raw, user.sex))
      .filter((marker) => marker.code && !marker.needsConfirmation)
      .map((marker) => ({
        code: marker.code!,
        status: marker.status,
        value: marker.normalizedValue!,
        unit: marker.canonicalUnit!,
      }));

    const body: BodyProfile = {
      sex: user.sex,
      age: now.getUTCFullYear() - user.birthYear,
      heightCm: user.heightCm,
      weightKg: weight.weightKg,
      activityLevel: user.activityLevel,
    };
    const plan = buildTargets(body, history.goal, signals);
    const projection = projectGoalDate(
      body.weightKg,
      plan.targetWeightKg,
      plan.dailyEnergyDelta,
      today,
    );
    await prisma.goal.create({
      data: {
        userId: user.id,
        type: history.goal.type,
        startWeightKg: body.weightKg,
        targetWeightKg: plan.targetWeightKg,
        kcalTarget: plan.targets.kcal,
        proteinG: plan.targets.proteinG,
        carbsG: plan.targets.carbsG,
        fatG: plan.targets.fatG,
        fiberG: plan.targets.fiberG,
        waterMl: plan.targets.waterMl,
        saturatedFatMaxG: plan.targets.saturatedFatMaxG,
        addedSugarMaxG: plan.targets.addedSugarMaxG,
        weeklyChangeKg: projection.weeklyChangeKg,
        projectedDate: projection.projectedDate
          ? new Date(`${projection.projectedDate}T00:00:00Z`)
          : null,
        adjustments: plan.adjustments,
        foodSuggestions: plan.foodSuggestions,
        reasoning: fallbackPlanReasoning({
          name: user.name,
          goalType: history.goal.type,
          targets: plan.targets,
          dailyEnergyDelta: plan.dailyEnergyDelta,
          currentWeightKg: body.weightKg,
          targetWeightKg: plan.targetWeightKg,
          projectedDate: projection.projectedDate,
          adjustments: plan.adjustments,
          flaggedMarkers: signals
            .filter((s) => isFlagged(s.status))
            .map((s) => ({ ...s, label: getMarkerDefinition(s.code).label })),
        }),
      },
    });

    for (const [index, menu] of history.days.entries()) {
      const date = addDays(today, index - (history.days.length - 1));
      const mealTotals = [];
      for (const [mealType, portions] of Object.entries(menu) as Array<[MealType, Portion[]]>) {
        const eatenAt = new Date(`${date}T${MEAL_HOURS[mealType]}:00+05:30`);
        if (eatenAt > now) continue;
        const items = portions.map(([name, quantity], position) => {
          const dish = dishes.get(name);
          if (!dish) throw new Error(`Demo dish "${name}" is not in the dish table`);
          const unit = dish.unit as PortionUnit;
          return {
            position,
            name: dish.name,
            dishRefId: dish.id,
            quantity,
            unit,
            confidence: 0.9,
            edited: false,
            ...nutritionForPortion({ ...dish, unit }, quantity, unit)!,
          };
        });
        const totals = sumMacros(items);
        mealTotals.push(totals);
        await prisma.meal.create({
          data: {
            userId: user.id,
            mealType,
            eatenAt,
            localDate: new Date(`${date}T00:00:00Z`),
            source: 'photo',
            status: 'confirmed',
            idempotencyKey: `demo:${date}:${mealType}`,
            requestHash: 'demo',
            totals: totals as unknown as Prisma.InputJsonValue,
            items: { create: items },
          },
        });
      }
      const consumed = sumMacros(mealTotals);
      await prisma.dailySummary.create({
        data: {
          userId: user.id,
          date: new Date(`${date}T00:00:00Z`),
          ...consumed,
          mealsCount: mealTotals.length,
          onTarget: isDayOnTarget(consumed, plan.targets, mealTotals.length),
        },
      });
    }
  }
}
