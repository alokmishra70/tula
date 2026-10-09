import { Injectable } from '@nestjs/common';
import type { Macros, MealSource, MealStatus, MealType, PortionUnit } from '@tula/shared';
import type {
  Meal as MealRow,
  MealItem as MealItemRow,
  Prisma,
} from '../../generated/prisma/client';
import type { IsoDate } from '../../domain/time';
import { DbContext } from '../../infrastructure/database/db-context';

export interface MealItemRecord extends Macros {
  id: string;
  name: string;
  quantity: number;
  unit: PortionUnit;
  confidence: number;
  dishRefId: string | null;
  edited: boolean;
}

export type NewMealItem = Omit<MealItemRecord, 'id'>;

export interface MealRecord {
  id: string;
  userId: string;
  mealType: MealType;
  eatenAt: Date;
  localDate: IsoDate;
  source: MealSource;
  mediaKey: string | null;
  rawText: string | null;
  status: MealStatus;
  idempotencyKey: string;
  requestHash: string;
  totals: Macros;
  items: MealItemRecord[];
}

export type NewMeal = Omit<MealRecord, 'id' | 'items'> & { items: NewMealItem[] };
export type MealChanges = Partial<
  Pick<MealRecord, 'mealType' | 'eatenAt' | 'localDate' | 'status' | 'totals'>
> & {
  items?: NewMealItem[];
};

export abstract class MealRepository {
  abstract create(meal: NewMeal): Promise<MealRecord>;
  abstract update(id: string, changes: MealChanges): Promise<MealRecord>;
  abstract delete(id: string): Promise<void>;
  abstract findForUser(id: string, userId: string): Promise<MealRecord | null>;
  abstract findByIdempotencyKey(userId: string, key: string): Promise<MealRecord | null>;
  abstract listByDates(userId: string, from: IsoDate, to: IsoDate): Promise<MealRecord[]>;
  abstract countForUser(userId: string): Promise<number>;
  abstract listPending(
    createdAfter: Date,
    createdBefore: Date,
    limit: number,
  ): Promise<MealRecord[]>;
}

type MealWithItems = MealRow & { items: MealItemRow[] };

const toDate = (isoDate: IsoDate) => new Date(`${isoDate}T00:00:00Z`);
const include = { items: { orderBy: { position: 'asc' } } } satisfies Prisma.MealInclude;

const toRecord = (row: MealWithItems): MealRecord => ({
  id: row.id,
  userId: row.userId,
  mealType: row.mealType,
  eatenAt: row.eatenAt,
  localDate: row.localDate.toISOString().slice(0, 10),
  source: row.source,
  mediaKey: row.mediaKey,
  rawText: row.rawText,
  status: row.status,
  idempotencyKey: row.idempotencyKey,
  requestHash: row.requestHash,
  totals: row.totals as unknown as Macros,
  items: row.items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    unit: item.unit as PortionUnit,
    kcal: item.kcal,
    proteinG: item.proteinG,
    carbsG: item.carbsG,
    fatG: item.fatG,
    fiberG: item.fiberG,
    confidence: item.confidence,
    dishRefId: item.dishRefId,
    edited: item.edited,
  })),
});

const itemsData = (items: NewMealItem[]) => items.map((item, position) => ({ ...item, position }));

@Injectable()
export class PrismaMealRepository extends MealRepository {
  constructor(private readonly db: DbContext) {
    super();
  }

  async create({ items, localDate, totals, ...meal }: NewMeal): Promise<MealRecord> {
    const row = await this.db.client.meal.create({
      data: {
        ...meal,
        localDate: toDate(localDate),
        totals: totals as unknown as Prisma.InputJsonValue,
        items: { create: itemsData(items) },
      },
      include,
    });
    return toRecord(row);
  }

  async update(
    id: string,
    { items, localDate, totals, ...changes }: MealChanges,
  ): Promise<MealRecord> {
    if (items) await this.db.client.mealItem.deleteMany({ where: { mealId: id } });
    const row = await this.db.client.meal.update({
      where: { id },
      data: {
        ...changes,
        localDate: localDate ? toDate(localDate) : undefined,
        totals: totals as unknown as Prisma.InputJsonValue | undefined,
        items: items ? { create: itemsData(items) } : undefined,
      },
      include,
    });
    return toRecord(row);
  }

  async delete(id: string): Promise<void> {
    await this.db.client.meal.delete({ where: { id } });
  }

  async findForUser(id: string, userId: string): Promise<MealRecord | null> {
    const row = await this.db.client.meal.findFirst({ where: { id, userId }, include });
    return row && toRecord(row);
  }

  async findByIdempotencyKey(userId: string, idempotencyKey: string): Promise<MealRecord | null> {
    const row = await this.db.client.meal.findUnique({
      where: { userId_idempotencyKey: { userId, idempotencyKey } },
      include,
    });
    return row && toRecord(row);
  }

  async listByDates(userId: string, from: IsoDate, to: IsoDate): Promise<MealRecord[]> {
    const rows = await this.db.client.meal.findMany({
      where: { userId, localDate: { gte: toDate(from), lte: toDate(to) } },
      orderBy: { eatenAt: 'asc' },
      include,
    });
    return rows.map(toRecord);
  }

  countForUser(userId: string): Promise<number> {
    return this.db.client.meal.count({ where: { userId } });
  }

  async listPending(createdAfter: Date, createdBefore: Date, limit: number): Promise<MealRecord[]> {
    const rows = await this.db.client.meal.findMany({
      where: { status: 'pending', createdAt: { gte: createdAfter, lte: createdBefore } },
      orderBy: { createdAt: 'asc' },
      take: limit,
      include,
    });
    return rows.map(toRecord);
  }
}
