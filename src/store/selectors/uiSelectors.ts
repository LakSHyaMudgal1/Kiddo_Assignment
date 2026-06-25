import type { RootStore } from '../rootStore';

export const selectThemeMode = (state: RootStore) => state.themeMode;
export const selectToasts = (state: RootStore) => state.toasts;
export const selectIsGlobalLoading = (state: RootStore) => state.isGlobalLoading;
export const selectGlobalLoadingMessage = (state: RootStore) => state.globalLoadingMessage;
export const selectActiveBottomSheet = (state: RootStore) => state.activeBottomSheet;
