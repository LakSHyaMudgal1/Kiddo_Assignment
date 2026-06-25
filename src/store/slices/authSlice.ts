import type { StateCreator } from 'zustand';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  phoneNumber: string | null;
}

export interface AuthSlice {
  // State
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;

  // Actions
  setUser: (user: User) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (
  set,
) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isAuthLoading: false,

  setUser: (user) =>
    set({ user, isAuthenticated: true }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  logout: () =>
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    }),

  setAuthLoading: (isAuthLoading) => set({ isAuthLoading }),
});
