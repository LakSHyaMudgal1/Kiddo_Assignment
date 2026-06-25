import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { ActionDispatcher } from '@actions/ActionDispatcher';
import type { AppAction } from '@actions/types';

interface ActionContextValue {
  dispatch: (action: AppAction) => Promise<void>;
}

const ActionContext = createContext<ActionContextValue | undefined>(undefined);

/**
 * ActionProvider
 *
 * Exposes the ActionDispatcher to the component tree via context.
 * Components call useActionDispatch() rather than importing the singleton
 * directly — this makes them easier to test (just swap the provider).
 */
export const ActionProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const value = useMemo<ActionContextValue>(
    () => ({
      dispatch: (action) => ActionDispatcher.dispatch(action),
    }),
    [],
  );

  return (
    <ActionContext.Provider value={value}>{children}</ActionContext.Provider>
  );
};

export const useActionDispatch = (): ((action: AppAction) => Promise<void>) => {
  const ctx = useContext(ActionContext);
  if (!ctx) {
    throw new Error('useActionDispatch must be used within an ActionProvider');
  }
  return ctx.dispatch;
};
