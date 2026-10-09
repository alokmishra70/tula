import { create } from 'zustand';

export type ToastKind = 'success' | 'info' | 'error';

export interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
  action?: { label: string; onPress: () => void };
}

interface ToastState {
  current: ToastItem | null;
  show: (toast: Omit<ToastItem, 'id'>) => void;
  hide: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (toast) => set({ current: { ...toast, id: nextId++ } }),
  hide: (id) => set((state) => (state.current?.id === id ? { current: null } : state)),
}));

export const toast = {
  success: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().show({ kind: 'success', message, action }),
  info: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().show({ kind: 'info', message, action }),
  error: (message: string, action?: ToastItem['action']) =>
    useToastStore.getState().show({ kind: 'error', message, action }),
};
