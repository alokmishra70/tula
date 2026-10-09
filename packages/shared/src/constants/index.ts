export const HEADERS = {
  deviceId: 'x-device-id',
  idempotencyKey: 'idempotency-key',
  requestId: 'x-request-id',
} as const;

export const LIMITS = {
  uploadMaxBytes: 10 * 1024 * 1024,
  voiceMaxSeconds: 30,
  chatMessageMaxChars: 1000,
  mealTextMaxChars: 500,
  mealItemsMax: 20,
  aiCallsPerHour: 30,
  notificationsPerDay: 3,
} as const;

export const THRESHOLDS = {
  lowConfidence: 0.6,
} as const;

export const STREAK_MILESTONES = [3, 7, 14, 30] as const;

export const ONBOARDING_BOUNDS = {
  age: { min: 15, max: 90 },
  heightCm: { min: 120, max: 230 },
  weightKg: { min: 30, max: 250 },
} as const;

// Seeded demo profiles, loadable from the hidden switcher on onboarding.
export const DEMO_DEVICE_IDS = {
  rohan: '00000000-0000-4000-8000-00000000d001',
  priya: '00000000-0000-4000-8000-00000000d002',
} as const;

// Local times after which a meal counts as missed; also drives reminder notifications.
export const MEAL_REMINDER_TIMES = {
  breakfast: { hour: 10, minute: 0 },
  lunch: { hour: 13, minute: 30 },
  dinner: { hour: 20, minute: 30 },
} as const;

export const EVENING_RECAP_TIME = { hour: 21, minute: 0 } as const;
