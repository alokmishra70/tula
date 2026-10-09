import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { keyValueStore } from './storage';

interface SessionState {
  onboarded: boolean;
  setOnboarded: (onboarded: boolean) => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      onboarded: false,
      setOnboarded: (onboarded) => set({ onboarded }),
    }),
    { name: 'tula.session', storage: createJSONStorage(() => keyValueStore) },
  ),
);

/** Re-reads the snapshot on subscribe, so a hydration that finishes before the effect isn't missed. */
export function useSessionHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useSession.persist.onFinishHydration(onChange),
    () => useSession.persist.hasHydrated(),
  );
}
