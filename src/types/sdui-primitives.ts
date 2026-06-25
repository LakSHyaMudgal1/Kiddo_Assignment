/**
 * sdui-primitives.ts
 *
 * Shared atomic types used across all SDUI component data interfaces.
 * Every primitive here is self-contained and has no imports from component
 * files, so it can be safely imported from anywhere in the tree.
 */

import type { SemanticColorKey } from '@theme/semanticColors';
import type { AppAction } from '@actions/types';

// ─────────────────────────────────────────────────────────────────────────────
// Visual primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A resolved color value accepted by SDUI components.
 *
 * - `SemanticColorKey`   → key from the design-system (e.g. "brandPrimary")
 * - `HexColor`          → raw override from the server (e.g. "#FF5733")
 * - `RgbaColor`         → rgba string (e.g. "rgba(255,87,51,0.9)")
 *
 * The renderer resolves semantic keys through the active theme; raw values
 * are passed through as-is.
 */
export type SDUIColor = SemanticColorKey | `#${string}` | `rgba(${string})`;

/**
 * A gradient stop used in SDUIGradient.
 */
export interface SDUIGradientStop {
  color: SDUIColor;
  /** Position in the gradient, 0–1 */
  position: number;
}

/**
 * Linear or radial gradient descriptor.
 */
export type SDUIGradient =
  | {
      type: 'linear';
      /** Angle in degrees (0 = top→bottom, 90 = left→right) */
      angle: number;
      stops: [SDUIGradientStop, SDUIGradientStop, ...SDUIGradientStop[]];
    }
  | {
      type: 'radial';
      stops: [SDUIGradientStop, SDUIGradientStop, ...SDUIGradientStop[]];
    };

/**
 * Background: solid color, gradient, or transparent.
 */
export type SDUIBackground =
  | { kind: 'solid'; color: SDUIColor }
  | { kind: 'gradient'; gradient: SDUIGradient }
  | { kind: 'transparent' };

// ─────────────────────────────────────────────────────────────────────────────
// Media primitives
// ─────────────────────────────────────────────────────────────────────────────

export type SDUIImageResizeMode = 'cover' | 'contain' | 'stretch' | 'center';

/**
 * A server-supplied image asset.
 * `srcSet` allows the server to supply multiple resolutions.
 */
export interface SDUIImage {
  uri: string;
  /** Alt text for accessibility */
  alt: string;
  /** Blurhash or low-res data URI for the loading placeholder */
  placeholder?: string;
  resizeMode?: SDUIImageResizeMode;
  /** Width hint (logical pixels) — helps FlashList pre-size cells */
  width?: number;
  /** Height hint (logical pixels) */
  height?: number;
  /** Higher-resolution override for 2×/3× screens */
  srcSet?: {
    '2x'?: string;
    '3x'?: string;
  };
}

/**
 * A Lottie animation asset.
 */
export interface SDUILottieAsset {
  /** Remote JSON URL or bundled asset key */
  source: string | number;
  loop?: boolean;
  autoPlay?: boolean;
  /** 0–1 speed multiplier */
  speed?: number;
  /** Named segment to play, e.g. { start: 'idle', end: 'burst' } */
  segment?: { start: number; end: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Typography primitives
// ─────────────────────────────────────────────────────────────────────────────

export type SDUIFontWeight = 'regular' | 'medium' | 'semiBold' | 'bold' | 'extraBold';
export type SDUITextAlign = 'left' | 'center' | 'right';
export type SDUITextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';

export interface SDUITextStyle {
  color?: SDUIColor;
  weight?: SDUIFontWeight;
  size?: number;
  align?: SDUITextAlign;
  transform?: SDUITextTransform;
  /** Interpret the string as markdown (bold/italic/links) */
  markdown?: boolean;
  /** Max number of lines before truncation */
  numberOfLines?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Spacing / layout primitives
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUIInsets {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface SDUIBorderStyle {
  width?: number;
  color?: SDUIColor;
  radius?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Action primitives
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The three required SDUI actions, expressed as a strict discriminated union.
 * This is a sub-type of AppAction — only these variants are valid in SDUI nodes.
 *
 * The `_brand` field is a phantom type discriminant that helps TypeScript
 * narrow correctly when the same handler accepts any SDUIComponentAction.
 */
export type SDUIComponentAction =
  | {
      type: 'ADD_TO_CART';
      payload: import('@actions/types').AddToCartPayload;
    }
  | {
      type: 'DEEP_LINK';
      payload: import('@actions/types').DeepLinkPayload;
    }
  | {
      type: 'APPLY_MYSTERY_GIFT_COUPON';
      payload: import('@actions/types').ApplyMysteryGiftCouponPayload;
    };

/** Convenience: any AppAction is also valid where SDUIComponentAction is expected */
export type SDUIActionRef = SDUIComponentAction | AppAction;

// ─────────────────────────────────────────────────────────────────────────────
// Visibility / personalisation primitives
// ─────────────────────────────────────────────────────────────────────────────

export type SDUIConditionOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn';

export interface SDUICondition {
  /** Dot-path into the Zustand store, e.g. "user.tier" or "isAuthenticated" */
  storeKey: string;
  operator: SDUIConditionOperator;
  value: unknown;
}

/**
 * Composite visibility rule — supports AND / OR logic.
 * Simple single-condition case uses `conditions` with one entry.
 */
export interface SDUIVisibility {
  logic: 'AND' | 'OR';
  conditions: [SDUICondition, ...SDUICondition[]];
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics primitives
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUIAnalytics {
  /** Impression event name, e.g. "banner_hero_viewed" */
  impressionEvent?: string;
  /** Tap / interaction event name */
  tapEvent?: string;
  /** Free-form key-value bag merged with every event */
  properties?: Record<string, string | number | boolean>;
}
