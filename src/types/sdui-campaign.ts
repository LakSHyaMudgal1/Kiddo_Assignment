/**
 * sdui-campaign.ts
 *
 * Campaign and promotion metadata attached to SDUI components.
 * The server embeds these in component nodes to drive analytics,
 * eligibility checks, and display rules — all without client logic.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Core campaign identity
// ─────────────────────────────────────────────────────────────────────────────

export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'ended';

export type CampaignTargetAudience =
  | 'all'
  | 'new_users'
  | 'returning_users'
  | 'premium_members'
  | 'cart_abandoners'
  | 'segment'; // custom segment — id in `segmentId`

export interface CampaignAudienceRule {
  audience: CampaignTargetAudience;
  /** Required when audience === 'segment' */
  segmentId?: string;
  /** Minimum app version required to show this campaign */
  minAppVersion?: string;
  /** Platform restriction */
  platforms?: ('ios' | 'android')[];
  /** Locale restriction — ISO 639-1 codes, e.g. ["en", "hi"] */
  locales?: string[];
}

/**
 * Core campaign metadata. Attached to every campaign-aware component.
 */
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  /** ISO 8601 — when the campaign becomes active */
  startsAt: string;
  /** ISO 8601 — when the campaign expires (null = no expiry) */
  endsAt: string | null;
  /** Audience eligibility rules */
  audience: CampaignAudienceRule;
  /** Priority when multiple campaigns compete for the same slot (higher wins) */
  priority: number;
  /** Unique impression cap per user (null = unlimited) */
  maxImpressionsPerUser: number | null;
  /** A/B experiment identifier, if this campaign is part of an experiment */
  experimentId?: string;
  /** Which variant of the experiment this node belongs to */
  experimentVariant?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Promotion / coupon sub-types
// ─────────────────────────────────────────────────────────────────────────────

export type DiscountKind = 'percentage' | 'flat' | 'free_shipping' | 'bxgy' | 'mystery';

export interface PromotionBadge {
  /** Short label shown on the component, e.g. "40% OFF" or "FREE GIFT" */
  label: string;
  /** Sub-label, e.g. "on orders above ₹999" */
  subLabel?: string;
  /** Colour of the badge — resolved through SDUIColor */
  color?: import('./sdui-primitives').SDUIColor;
  textColor?: import('./sdui-primitives').SDUIColor;
}

export interface Promotion {
  id: string;
  campaignId: string;
  discountKind: DiscountKind;
  /** Percentage value (0–100) when discountKind === 'percentage' */
  discountPercent?: number;
  /** Flat amount when discountKind === 'flat' */
  discountAmount?: number;
  /** Minimum cart value to unlock the promotion */
  minCartValue?: number;
  /** Maximum discount cap (prevents runaway percentage discounts) */
  maxDiscountCap?: number;
  badge?: PromotionBadge;
  /** ISO 8601 expiry — used to drive countdown timers */
  expiresAt?: string;
  /** Whether the coupon auto-applies or requires user action */
  autoApply: boolean;
  /** The coupon code shown to the user (null for mystery/auto-apply) */
  couponCode: string | null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Flash-sale / countdown
// ─────────────────────────────────────────────────────────────────────────────

export interface SDUICountdown {
  /** ISO 8601 target date */
  endsAt: string;
  /** Label before the digits, e.g. "Ends in" */
  prefixLabel?: string;
  /** Shown after the timer reaches zero instead of hiding */
  expiredLabel?: string;
  /** Hide the component entirely once the countdown expires */
  hideOnExpiry?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mystery gift specifics
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extra metadata for the APPLY_MYSTERY_GIFT_COUPON flow.
 * Embedded in SDUI nodes that trigger this action.
 */
export interface MysteryGiftMeta {
  campaignId: string;
  /** Teaser description shown before reveal, e.g. "Unlock your mystery gift!" */
  teaserText: string;
  /** Lottie animation played during reveal */
  revealLottieSource?: string;
  /** Min cart value required; mirrors ApplyMysteryGiftCouponPayload.minCartValue */
  minCartValue?: number;
  /** Message shown when cart value requirement is not met */
  insufficientCartMessage?: string;
}
