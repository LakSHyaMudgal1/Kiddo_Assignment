import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { createAuthSlice, type AuthSlice } from './slices/authSlice';
import { createCartSlice, type CartSlice } from './slices/cartSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';
import { createCatalogSlice, type CatalogSlice } from './slices/catalogSlice';
import { createWishlistSlice, type WishlistSlice } from './slices/wishlistSlice';
import { asyncStorageAdapter, persistKey } from './middleware/persist';
import { logger } from './middleware/logger';

/**
 * Root store type — union of all slices.
 */
export type RootStore = AuthSlice &
  CartSlice &
  UISlice &
  CatalogSlice &
  WishlistSlice;

/**
 * useStore — the single Zustand store for the application.
 *
 * Middleware stack (innermost → outermost):
 *  immer → logger → devtools → persist
 */
export const useStore = create<RootStore>()(
  devtools(
    persist(
      logger(
        immer((...args) => ({
          ...createAuthSlice(...args),
          ...createCartSlice(...args),
          ...createUISlice(...args),
          ...createCatalogSlice(...args),
          ...createWishlistSlice(...args),
        })),
        'RootStore',
      ),
      {
        name: persistKey('root'),
        storage: asyncStorageAdapter,
        // Only persist selected slices — never persist UI ephemeral state
        partialize: (state) => ({
          // Auth
          user: state.user,
          accessToken: state.accessToken,
          refreshToken: state.refreshToken,
          isAuthenticated: state.isAuthenticated,
          // Cart
          items: state.items,
          couponCode: state.couponCode,
          // Wishlist
          wishlistItems: state.wishlistItems,
          // UI preferences
          themeMode: state.themeMode,
          // Catalog
          recentSearches: state.recentSearches,
        }),
      },
    ),
    { name: 'KiddoStore', enabled: __DEV__ },
  ),
);
