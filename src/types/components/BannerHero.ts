/**
 * BANNER_HERO component data interface.
 *
 * A full-width hero banner typically occupying the top of a page.
 * Supports background image/video, overlaid text, a primary CTA,
 * an optional secondary CTA, a campaign countdown, and theme overrides.
 *
 *  ┌──────────────────────────────────────────┐
 *  │  [background image / gradient]           │
 *  │                                          │
 *  │   eyebrowText                            │
 *  │   headline                               │
 *  │   subheadline                            │
 *  │                                          │
 *  │   [primaryCTA]   [secondaryCTA?]         │
 *  │                        [countdown?]      │
 *  └──────────────────────────────────────────┘
 */

import type {
  SDUIImage,
  SDUIBackground,
  SDUITextStyle,
  SDUIComponentAction,
  SDUIAnalytics,
  SDUIVisibility,
  SDUIColor,
} from '../sdui-primitives';
import type { SDUIThemeOverride, SDUIButtonTheme, SDUITimerTheme } from '../sdui-theme';
import type { Campaign, Promotion, SDUICountdown } from '../sdui-campaign';

// ─────────────────────────────────────────────────────────────────────────────
// Sub-types
// ─────────────────────────────────────────────────────────────────────────────

export type BannerHeroMediaKind = 'image' | 'lottie' | 'video_thumbnail';

export interface BannerHeroMedia {
  kind: BannerHeroMediaKind;
  image?: SDUIImage;
  /** Lottie source URL or bundled key — used when kind === 'lottie' */
  lottieSource?: string | number;
  /** Poster image shown before a video loads */
  videoPoster?: SDUIImage;
  /** Video URL — rendered as a silent autoplaying clip */
  videoUri?: string;
}

export interface BannerHeroCTA {
  label: string;
  action: SDUIComponentAction;
  theme?: SDUIButtonTheme;
  /** Lottie animation on the button (e.g. sparkle on mystery gift) */
  lottieSource?: string;
  /** Accessible label override */
  accessibilityLabel?: string;
}

export interface BannerHeroTextContent {
  /** Small label above the headline, e.g. "LIMITED OFFER" */
  eyebrowText?: string;
  eyebrowStyle?: SDUITextStyle;

  headline: string;
  headlineStyle?: SDUITextStyle;

  subheadline?: string;
  subheadlineStyle?: SDUITextStyle;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout variants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Controls where text/CTAs are positioned relative to the media.
 */
export type BannerHeroLayout =
  | 'media_top_text_bottom'      // stacked: image then text
  | 'media_bottom_text_top'      // stacked: text then image
  | 'overlay_center'             // text centred over the image
  | 'overlay_bottom_left'        // text bottom-left over image
  | 'overlay_bottom_right'       // text bottom-right over image
  | 'split_left'                 // side-by-side: text left, image right
  | 'split_right';               // side-by-side: image left, text right

// ─────────────────────────────────────────────────────────────────────────────
// Root data interface
// ─────────────────────────────────────────────────────────────────────────────

export interface BannerHeroData {
  /** Determines positioning of media and text regions */
  layout: BannerHeroLayout;

  media: BannerHeroMedia;

  /** Optional scrim/gradient over the media for text legibility */
  scrim?: SDUIBackground;

  content: BannerHeroTextContent;

  primaryCTA: BannerHeroCTA;

  /** A second CTA, e.g. "Learn More" alongside "Shop Now" */
  secondaryCTA?: BannerHeroCTA;

  /** Countdown timer embedded in the banner */
  countdown?: SDUICountdown;
  countdownTheme?: SDUITimerTheme;

  /** Promotion badge (e.g. "40% OFF") floating over the banner */
  promotion?: Promotion;

  /** Campaign metadata for targeting and analytics */
  campaign?: Campaign;

  /** Per-component theme override */
  theme?: SDUIThemeOverride;

  /** Accessibility: label for the entire banner region */
  accessibilityLabel?: string;

  analytics?: SDUIAnalytics;

  visibility?: SDUIVisibility;

  /** Height of the banner in dp. Defaults to 300 if omitted. */
  height?: number;

  /** Whether to extend the banner behind the device status bar */
  extendBehindStatusBar?: boolean;

  /**
   * Tint applied over the entire banner — useful for seasonal themes
   * without a full image swap.
   */
  colorTint?: SDUIColor;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed SDUINode specialisation
// ─────────────────────────────────────────────────────────────────────────────

import type { SDUINode } from '@registry/types';

/** A fully-typed SDUI node for BANNER_HERO */
export type BannerHeroNode = SDUINode<BannerHeroData> & {
  type: 'BANNER_HERO';
};
