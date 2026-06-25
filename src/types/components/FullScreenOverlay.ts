/**
 * FULL_SCREEN_OVERLAY component data interface.
 *
 * A full-screen modal/interstitial driven entirely from the server.
 * Used for campaigns like:
 *   - Flash sale announcements
 *   - Mystery gift reveal
 *   - App-update prompts
 *   - First-launch onboarding banners
 *   - Seasonal promotions
 *
 * The overlay renders over the entire screen (including nav bars).
 * Dismissal behaviour is controlled by `dismissConfig`.
 *
 *  ┌──────────────────────────────────────────┐
 *  │ ░░░░░░░░░░░░ scrim ░░░░░░░░░░░░░░░░░░░░ │
 *  │ ░░░  ┌────────────────────────────┐  ░░ │
 *  │ ░░░  │  [closeButton]             │  ░░ │
 *  │ ░░░  │  [headerMedia]             │  ░░ │
 *  │ ░░░  │  headline                  │  ░░ │
 *  │ ░░░  │  body                      │  ░░ │
 *  │ ░░░  │  [lottie?]                 │  ░░ │
 *  │ ░░░  │  [primaryCTA]              │  ░░ │
 *  │ ░░░  │  [secondaryCTA?]           │  ░░ │
 *  │ ░░░  │  [footerText?]             │  ░░ │
 *  │ ░░░  └────────────────────────────┘  ░░ │
 *  │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
 *  └──────────────────────────────────────────┘
 */

import type {
  SDUIImage,
  SDUILottieAsset,
  SDUITextStyle,
  SDUIBackground,
  SDUIComponentAction,
  SDUIAnalytics,
  SDUIVisibility,
} from '../sdui-primitives';
import type {
  SDUIThemeOverride,
  SDUIButtonTheme,
  SDUITimerTheme,
  SDUIOverlayTheme,
} from '../sdui-theme';
import type { Campaign, Promotion, SDUICountdown, MysteryGiftMeta } from '../sdui-campaign';
import type { SDUINode } from '@registry/types';

// ─────────────────────────────────────────────────────────────────────────────
// Overlay content variants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The "kind" discriminant determines the primary content layout.
 *
 * Keeping this as a discriminated union ensures the renderer can
 * exhaustively handle every shape — adding a new kind is a compile-time
 * reminder to handle it.
 */
export type OverlayContentKind =
  | 'promotional'      // generic sale / campaign banner
  | 'mystery_gift'     // mystery gift reveal flow
  | 'flash_sale'       // countdown-driven flash sale
  | 'onboarding'       // first-run or feature highlight
  | 'app_update';      // soft/hard app update prompt

// ─────────────────────────────────────────────────────────────────────────────
// Header media
// ─────────────────────────────────────────────────────────────────────────────

export type OverlayHeaderMediaKind = 'image' | 'lottie' | 'none';

export interface OverlayHeaderMedia {
  kind: OverlayHeaderMediaKind;
  image?: SDUIImage;
  lottie?: SDUILottieAsset;
  /** Height of the media region in dp */
  height?: number;
  background?: SDUIBackground;
}

// ─────────────────────────────────────────────────────────────────────────────
// Close / dismiss config
// ─────────────────────────────────────────────────────────────────────────────

export type OverlayDismissMode =
  | 'close_button'     // explicit ✕ button only
  | 'scrim_tap'        // tapping the scrim dismisses
  | 'both'             // either close button or scrim tap
  | 'none'             // cannot be dismissed (force action)
  | 'auto';            // auto-dismiss after `autoDismissDelay` ms

export interface OverlayDismissConfig {
  mode: OverlayDismissMode;
  /** Required when mode === 'auto' — delay in ms */
  autoDismissDelay?: number;
  /** Action fired when the overlay is dismissed (e.g. TRACK_EVENT) */
  onDismissAction?: SDUIComponentAction;
  /** Position of the close button */
  closeButtonPosition?: 'top_left' | 'top_right';
  /** Icon source for the close button */
  closeButtonIconUri?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// CTA
// ─────────────────────────────────────────────────────────────────────────────

export interface OverlayCTA {
  label: string;
  action: SDUIComponentAction;
  theme?: SDUIButtonTheme;
  /** Loading animation on the button (e.g. spinner while coupon is applied) */
  loaderLottieSource?: string;
  accessibilityLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Content body variants — discriminated by OverlayContentKind
// ─────────────────────────────────────────────────────────────────────────────

interface OverlayBaseContent {
  headerMedia?: OverlayHeaderMedia;
  headline: string;
  headlineStyle?: SDUITextStyle;
  body?: string;
  bodyStyle?: SDUITextStyle;
  primaryCTA: OverlayCTA;
  secondaryCTA?: OverlayCTA;
  /** Fine-print below the CTAs */
  footerText?: string;
  footerTextStyle?: SDUITextStyle;
}

export interface OverlayPromotionalContent extends OverlayBaseContent {
  kind: 'promotional';
  promotion?: Promotion;
}

export interface OverlayMysteryGiftContent extends OverlayBaseContent {
  kind: 'mystery_gift';
  mysteryGift: MysteryGiftMeta;
  /** Lottie played while the coupon is being applied */
  applyingLottie?: SDUILottieAsset;
  /** Lottie played after a successful reveal */
  revealLottie?: SDUILottieAsset;
}

export interface OverlayFlashSaleContent extends OverlayBaseContent {
  kind: 'flash_sale';
  countdown: SDUICountdown;
  countdownTheme?: SDUITimerTheme;
  promotion?: Promotion;
}

export interface OverlayOnboardingContent extends OverlayBaseContent {
  kind: 'onboarding';
  /** Step indicator dots for multi-step onboarding */
  steps?: number;
  currentStep?: number;
}

export interface OverlayAppUpdateContent {
  kind: 'app_update';
  headerMedia?: OverlayHeaderMedia;
  headline: string;
  headlineStyle?: SDUITextStyle;
  body?: string;
  bodyStyle?: SDUITextStyle;
  updateCTA: OverlayCTA;
  /** Shown only when the update is not mandatory */
  skipCTA?: OverlayCTA;
  /** When true, there is no skip option — all dismiss modes are overridden */
  isMandatory: boolean;
  /** App store URL — used by the updateCTA action if not explicitly set */
  storeUrl: string;
}

/**
 * The discriminated union of all overlay content shapes.
 */
export type OverlayContent =
  | OverlayPromotionalContent
  | OverlayMysteryGiftContent
  | OverlayFlashSaleContent
  | OverlayOnboardingContent
  | OverlayAppUpdateContent;

/** Helper: extract a specific content kind */
export type OverlayContentOfKind<K extends OverlayContent['kind']> =
  Extract<OverlayContent, { kind: K }>;

// ─────────────────────────────────────────────────────────────────────────────
// Display trigger config
// ─────────────────────────────────────────────────────────────────────────────

export type OverlayTrigger =
  | { on: 'page_load' }
  | { on: 'delay'; delayMs: number }
  | { on: 'scroll_depth'; percent: number }        // 0–100
  | { on: 'exit_intent' }
  | { on: 'add_to_cart' }
  | { on: 'manual' };                              // triggered by ActionDispatcher

// ─────────────────────────────────────────────────────────────────────────────
// Root data interface
// ─────────────────────────────────────────────────────────────────────────────

export interface FullScreenOverlayData {
  /** Controls content layout and which fields are required */
  content: OverlayContent;

  /** When and how the overlay appears */
  trigger: OverlayTrigger;

  /** How the overlay can be dismissed */
  dismissConfig: OverlayDismissConfig;

  /** Overlay visual theme */
  overlayTheme?: SDUIOverlayTheme;

  /** Container theme override */
  theme?: SDUIThemeOverride;

  /** Campaign metadata for targeting and frequency capping */
  campaign?: Campaign;

  analytics?: SDUIAnalytics;

  visibility?: SDUIVisibility;

  /**
   * Whether to show this overlay at most once per session.
   * The renderer persists a seen-flag in AsyncStorage.
   */
  showOncePerSession?: boolean;

  /**
   * Whether to show this overlay at most once ever (per install).
   */
  showOncePerInstall?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed SDUINode specialisation
// ─────────────────────────────────────────────────────────────────────────────

export type FullScreenOverlayNode = SDUINode<FullScreenOverlayData> & {
  type: 'FULL_SCREEN_OVERLAY';
};
