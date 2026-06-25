/**
 * sdui-theme.ts
 *
 * Server-side theme overrides that can be sent per-component or per-campaign.
 *
 * The server can adjust visual properties without shipping a new app build.
 * The renderer merges these overrides on top of the active AppTheme.
 *
 * Constraint: these types only allow *loosening* the design system (tinting,
 * spacing overrides, corner radius overrides). They cannot introduce entirely
 * new colours outside the palette — SDUIColor enforces that boundary.
 */

import type { SDUIBackground, SDUIColor, SDUIBorderStyle, SDUIInsets } from './sdui-primitives';

// ─────────────────────────────────────────────────────────────────────────────
// Component-level theme override
// ─────────────────────────────────────────────────────────────────────────────

/**
 * SDUIThemeOverride — attached to a single component node.
 * Every field is optional; the renderer falls back to the active AppTheme
 * for anything not specified here.
 */
export interface SDUIThemeOverride {
  background?: SDUIBackground;
  foregroundColor?: SDUIColor;
  accentColor?: SDUIColor;
  border?: SDUIBorderStyle;
  padding?: SDUIInsets;
  /** Corner radius override in dp */
  borderRadius?: number;
  /** Elevation / shadow level: 0–5 */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Opacity of the entire component: 0–1 */
  opacity?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Badge / label theme
// ─────────────────────────────────────────────────────────────────────────────

export type SDUIBadgeVariant =
  | 'filled'
  | 'outlined'
  | 'subtle'
  | 'inverse';

export interface SDUIBadgeTheme {
  variant: SDUIBadgeVariant;
  background?: SDUIColor;
  textColor?: SDUIColor;
  borderColor?: SDUIColor;
  borderRadius?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA Button theme
// ─────────────────────────────────────────────────────────────────────────────

export type SDUIButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'link';
export type SDUIButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'full';

export interface SDUIButtonTheme {
  variant?: SDUIButtonVariant;
  size?: SDUIButtonSize;
  background?: SDUIColor;
  textColor?: SDUIColor;
  borderColor?: SDUIColor;
  borderRadius?: number;
  /** Show a Lottie loader instead of text when loading=true */
  loaderLottieSource?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Countdown timer theme
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUITimerTheme {
  background?: SDUIColor;
  digitColor?: SDUIColor;
  labelColor?: SDUIColor;
  separatorColor?: SDUIColor;
  borderRadius?: number;
  /** Whether to show a pulsing animation when < 1 hour remains */
  pulseOnUrgency?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Overlay / modal theme
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUIOverlayTheme {
  /** Scrim behind the overlay content */
  scrimColor?: SDUIColor;
  /** Opacity of the scrim: 0–1 */
  scrimOpacity?: number;
  contentBackground?: SDUIBackground;
  borderRadius?: number;
  /** Whether tapping outside the overlay dismisses it */
  dismissOnScrimTap?: boolean;
  /** Entrance animation */
  enterAnimation?: 'fade' | 'slide_up' | 'slide_down' | 'zoom' | 'none';
  /** Exit animation */
  exitAnimation?: 'fade' | 'slide_down' | 'slide_up' | 'zoom' | 'none';
  /** Duration of the enter/exit animation in ms */
  animationDuration?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Card theme (used by product cards in grid / collection)
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUICardTheme {
  background?: SDUIColor;
  borderRadius?: number;
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  /** Aspect ratio of the image region, e.g. 1 (square), 1.33 (4:3) */
  imageAspectRatio?: number;
  /** Padding inside the card content region */
  contentPadding?: SDUIInsets;
  /** Show a subtle border */
  bordered?: boolean;
  borderColor?: SDUIColor;
}
