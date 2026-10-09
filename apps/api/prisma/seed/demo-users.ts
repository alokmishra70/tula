import { DEMO_DEVICE_IDS } from '@tula/shared';
import type { ActivityLevel, Sex } from '../../src/generated/prisma/enums';

export interface DemoUserSeed {
  deviceId: string;
  name: string;
  sex: Sex;
  birthYear: number;
  heightCm: number;
  activityLevel: ActivityLevel;
  timezone: string;
  weightHistoryKg: number[];
}

const currentYear = new Date().getUTCFullYear();

// Weight history is oldest first, one entry per week.
export const DEMO_USERS: DemoUserSeed[] = [
  {
    deviceId: DEMO_DEVICE_IDS.rohan,
    name: 'Rohan',
    sex: 'male',
    birthYear: currentYear - 31,
    heightCm: 176,
    activityLevel: 'sedentary',
    timezone: 'Asia/Kolkata',
    weightHistoryKg: [83.4, 83.1, 82.6, 82.0],
  },
  {
    deviceId: DEMO_DEVICE_IDS.priya,
    name: 'Priya',
    sex: 'female',
    birthYear: currentYear - 38,
    heightCm: 160,
    activityLevel: 'light',
    timezone: 'Asia/Kolkata',
    weightHistoryKg: [64.5, 64.2, 64.0],
  },
];
