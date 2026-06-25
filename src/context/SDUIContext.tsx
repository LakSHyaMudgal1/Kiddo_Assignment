import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import type { SDUINode } from '@registry/types';

interface SDUIContextValue {
  /**
   * The full page payload from the server.
   * Useful for components deep in the tree that need sibling data.
   */
  pageNodes: SDUINode[];
  /**
   * Page-level metadata the server can pass alongside the node tree.
   */
  pageMeta: Record<string, unknown>;
}

const SDUIContext = createContext<SDUIContextValue | undefined>(undefined);

interface SDUIProviderProps {
  pageNodes: SDUINode[];
  pageMeta?: Record<string, unknown>;
  children: ReactNode;
}

export const SDUIProvider: React.FC<SDUIProviderProps> = ({
  pageNodes,
  pageMeta = {},
  children,
}) => {
  const value = useMemo(
    () => ({ pageNodes, pageMeta }),
    [pageNodes, pageMeta],
  );

  return <SDUIContext.Provider value={value}>{children}</SDUIContext.Provider>;
};

export const useSDUIContext = (): SDUIContextValue => {
  const ctx = useContext(SDUIContext);
  if (!ctx) {
    throw new Error('useSDUIContext must be used within an SDUIProvider');
  }
  return ctx;
};
