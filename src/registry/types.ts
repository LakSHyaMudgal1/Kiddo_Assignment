import type { ComponentType } from 'react';

/**
 * Every server-driven component must declare a unique type key.
 * These keys are what the server sends down in the UI payload.
 */
export type ComponentTypeKey =
  // Layout
  | 'CONTAINER'
  | 'SPACER'
  | 'DIVIDER'
  | 'GRID'
  | 'HORIZONTAL_SCROLL'
  // Commerce
  | 'PRODUCT_CARD'
  | 'PRODUCT_CARD_HORIZONTAL'
  | 'PRODUCT_LIST'
  | 'CATEGORY_CHIP'
  | 'CATEGORY_GRID'
  | 'BANNER'
  | 'CAROUSEL'
  | 'FLASH_SALE_TIMER'
  | 'PRICE_TAG'
  | 'RATING_STARS'
  // Server Driven — Campaign components
  | 'BANNER_HERO'
  | 'PRODUCT_GRID_2X2'
  | 'DYNAMIC_COLLECTION'
  | 'FULL_SCREEN_OVERLAY'
  // Navigation
  | 'CTA_BUTTON'
  | 'LINK_ROW'
  | 'TAB_BAR'
  // Media
  | 'IMAGE'
  | 'VIDEO_THUMBNAIL'
  | 'LOTTIE_ANIMATION'
  // Text
  | 'HEADING'
  | 'BODY_TEXT'
  | 'BADGE'
  // Feedback
  | 'SKELETON'
  | 'EMPTY_STATE'
  | 'ERROR_STATE'
  // Form
  | 'TEXT_INPUT'
  | 'SEARCH_BAR'
  | 'FILTER_CHIPS';

/**
 * Base props every SDUI component receives.
 */
export interface SDUIBaseProps {
  /** Unique identifier for this component instance in the tree */
  id: string;
  /** The type key used for registry lookup */
  type: ComponentTypeKey;
  /** Optional analytics label */
  analyticsLabel?: string;
  /** Optional test ID for E2E */
  testID?: string;
}

/**
 * A server-driven UI node as returned by the API.
 * `data` is the component-specific prop bag — typed per component.
 */
export interface SDUINode<TData = Record<string, unknown>> {
  id: string;
  type: ComponentTypeKey;
  data: TData;
  children?: SDUINode[];
  action?: SDUIAction;
  visibility?: SDUIVisibilityRule;
  analyticsLabel?: string;
  testID?: string;
}

/**
 * An action definition embedded in the SDUI node.
 * Consumed by the ActionDispatcher.
 */
export interface SDUIAction {
  type: string;
  payload?: Record<string, unknown>;
}

/**
 * Visibility rule — allows server to conditionally show components.
 */
export interface SDUIVisibilityRule {
  /** Zustand store key to evaluate */
  storeKey: string;
  /** Expected value */
  equals: unknown;
}

/**
 * A registered component entry.
 */
export interface RegistryEntry<TData = Record<string, unknown>> {
  component: ComponentType<SDUIBaseProps & { data: TData; children?: SDUINode[] }>;
  /**
   * Optional fallback component shown while the real one is loading
   * (useful with React.lazy)
   */
  fallback?: ComponentType;
  /**
   * Optional schema validator. Called with `data` before rendering.
   * Return false to render ErrorState instead.
   */
  validate?: (data: TData) => boolean;
}
