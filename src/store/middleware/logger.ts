import type { StateCreator, StoreMutatorIdentifier } from 'zustand';

type Logger = <
  T,
  Mps extends [StoreMutatorIdentifier, unknown][] = [],
  Mcs extends [StoreMutatorIdentifier, unknown][] = [],
>(
  f: StateCreator<T, Mps, Mcs>,
  name?: string,
) => StateCreator<T, Mps, Mcs>;

type LoggerImpl = <T>(
  f: StateCreator<T, [], []>,
  name?: string,
) => StateCreator<T, [], []>;

/**
 * Zustand logger middleware.
 * Only logs in __DEV__ to avoid leaking state in production.
 */
const loggerImpl: LoggerImpl = (f, name) => (set, get, store) => {
  const loggedSet: typeof set = (...args) => {
    if (__DEV__) {
      console.group(`[Store${name ? `:${name}` : ''}] state change`);
      console.log('prev', get());
    }
    set(...args);
    if (__DEV__) {
      console.log('next', get());
      console.groupEnd();
    }
  };
  return f(loggedSet, get, store);
};

export const logger = loggerImpl as unknown as Logger;
