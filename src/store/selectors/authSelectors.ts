import type { RootStore } from '../rootStore';

export const selectUser = (state: RootStore) => state.user;
export const selectIsAuthenticated = (state: RootStore) => state.isAuthenticated;
export const selectAccessToken = (state: RootStore) => state.accessToken;
export const selectIsAuthLoading = (state: RootStore) => state.isAuthLoading;
