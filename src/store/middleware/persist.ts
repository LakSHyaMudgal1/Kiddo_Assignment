import AsyncStorage from '@react-native-async-storage/async-storage';
import { createJSONStorage } from 'zustand/middleware';

/**
 * Shared AsyncStorage adapter for Zustand persist middleware.
 * Import this wherever you need persisted slices.
 */
export const asyncStorageAdapter = createJSONStorage(() => AsyncStorage);

/**
 * Utility: build a namespaced persist key.
 */
export const persistKey = (storeName: string): string =>
  `kiddo::store::${storeName}`;
