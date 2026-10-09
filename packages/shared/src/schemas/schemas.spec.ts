import { UploadUrlRequestSchema } from './media';
import { ParseMealRequestSchema, ParseMealResponseSchema } from './meal';
import { UpsertProfileRequestSchema } from './profile';
import { RegisterReportRequestSchema } from './report';

const eatenAt = '2026-10-08T13:10:00+05:30';

describe('UpsertProfileRequestSchema', () => {
  const valid = {
    name: 'Rohan',
    sex: 'male',
    age: 31,
    heightCm: 175,
    weightKg: 82,
    activityLevel: 'sedentary',
    timezone: 'Asia/Kolkata',
  };

  it('accepts a valid profile', () => {
    expect(UpsertProfileRequestSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects an age outside onboarding bounds', () => {
    expect(UpsertProfileRequestSchema.safeParse({ ...valid, age: 12 }).success).toBe(false);
  });
});

describe('ParseMealRequestSchema', () => {
  it('requires text for text source', () => {
    const result = ParseMealRequestSchema.safeParse({ source: 'text', mealType: 'lunch', eatenAt });
    expect(result.success).toBe(false);
  });

  it('requires a media key for photo source', () => {
    const ok = ParseMealRequestSchema.safeParse({
      source: 'photo',
      mealType: 'lunch',
      eatenAt,
      mediaKey: 'meal_photo/abc.jpg',
    });
    expect(ok.success).toBe(true);
  });
});

describe('ParseMealResponseSchema', () => {
  it('discriminates on outcome', () => {
    expect(ParseMealResponseSchema.parse({ outcome: 'not_food' })).toEqual({ outcome: 'not_food' });
  });
});

describe('UploadUrlRequestSchema', () => {
  it('rejects a content type not allowed for the kind', () => {
    const result = UploadUrlRequestSchema.safeParse({
      kind: 'meal_photo',
      contentType: 'application/pdf',
      sizeBytes: 1000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects files over 10 MB', () => {
    const result = UploadUrlRequestSchema.safeParse({
      kind: 'report',
      contentType: 'application/pdf',
      sizeBytes: 11 * 1024 * 1024,
    });
    expect(result.success).toBe(false);
  });
});

describe('RegisterReportRequestSchema', () => {
  it('requires a sha256 hex hash', () => {
    const result = RegisterReportRequestSchema.safeParse({
      fileKey: 'report/x.pdf',
      fileName: 'x.pdf',
      fileHash: 'not-a-hash',
    });
    expect(result.success).toBe(false);
  });
});
