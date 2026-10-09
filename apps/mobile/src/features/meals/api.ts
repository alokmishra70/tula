import {
  DeleteMealResponseSchema,
  HEADERS,
  MealWriteResponseSchema,
  ParseMealResponseSchema,
  QuickMealSchema,
  type CreateMealRequest,
  type DeleteMealResponse,
  type MealType,
  type MealWriteResponse,
  type ParseMealRequest,
  type ParseMealResponse,
  type QuickMeal,
  type UpdateMealRequest,
} from '@tula/shared';
import { z } from 'zod';
import { api } from '@/lib/api';

export const mealsApi = {
  parse: (body: ParseMealRequest, signal?: AbortSignal): Promise<ParseMealResponse> =>
    api.post('/meals/parse', body, { schema: ParseMealResponseSchema, signal }),
  create: (body: CreateMealRequest, idempotencyKey: string): Promise<MealWriteResponse> =>
    api.post('/meals', body, {
      schema: MealWriteResponseSchema,
      headers: { [HEADERS.idempotencyKey]: idempotencyKey },
    }),
  update: (id: string, body: UpdateMealRequest): Promise<MealWriteResponse> =>
    api.patch(`/meals/${id}`, body, { schema: MealWriteResponseSchema }),
  remove: (id: string): Promise<DeleteMealResponse> =>
    api.delete(`/meals/${id}`, { schema: DeleteMealResponseSchema }),
  quick: (mealType: MealType): Promise<QuickMeal[]> =>
    api.get('/meals/frequent', { query: { mealType }, schema: z.array(QuickMealSchema) }),
};
