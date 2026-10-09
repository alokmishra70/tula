import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { keyValueStore } from '@/lib/storage';

export interface ReminderPrefs {
  mealReminders: boolean;
  eveningRecap: boolean;
  weeklySummary: boolean;
}

interface PrefsState extends ReminderPrefs {
  toggle: (key: keyof ReminderPrefs) => void;
}

export const useReminderPrefs = create<PrefsState>()(
  persist(
    (set) => ({
      mealReminders: true,
      eveningRecap: true,
      weeklySummary: true,
      toggle: (key) => set((state) => ({ [key]: !state[key] })),
    }),
    { name: 'tula.reminders', storage: createJSONStorage(() => keyValueStore) },
  ),
);
