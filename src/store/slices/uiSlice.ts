import type { StateCreator } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
  duration?: number | undefined;
}

export interface BottomSheetConfig {
  id: string;
  snapPoints: string[];
  // Component key from registry
  componentKey: string;
  // Props forwarded to the sheet component
  props?: Record<string, unknown>;
}

export interface UISlice {
  // Theme
  themeMode: ThemeMode;

  // Toast queue
  toasts: Toast[];

  // Global loading overlay
  isGlobalLoading: boolean;
  globalLoadingMessage: string | undefined;

  // Active bottom sheets
  activeBottomSheet: BottomSheetConfig | undefined;

  // Actions
  setThemeMode: (mode: ThemeMode) => void;
  showToast: (toast: Omit<Toast, 'id'>) => void;
  dismissToast: (id: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  openBottomSheet: (config: BottomSheetConfig) => void;
  closeBottomSheet: () => void;
}

let toastIdCounter = 0;

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  themeMode: 'system',
  toasts: [],
  isGlobalLoading: false,
  globalLoadingMessage: undefined,
  activeBottomSheet: undefined,

  setThemeMode: (themeMode) => set({ themeMode }),

  showToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        { ...toast, id: `toast_${++toastIdCounter}_${Date.now()}` },
      ],
    })),

  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),

  setGlobalLoading: (isGlobalLoading, message = undefined) =>
    set({ isGlobalLoading, globalLoadingMessage: message }),

  openBottomSheet: (activeBottomSheet) => set({ activeBottomSheet }),

  closeBottomSheet: () => set({ activeBottomSheet: undefined }),
});
