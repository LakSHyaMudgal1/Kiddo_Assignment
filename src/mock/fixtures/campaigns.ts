/**
 * fixtures/campaigns.ts
 *
 * Reusable Campaign & Promotion objects.
 * Campaign switching works by changing campaignId in the page meta —
 * the renderer never hardcodes a campaign; it reads from the node payload.
 */
import type { Campaign, Promotion } from '@/types/sdui-campaign';

export const CAMPAIGN_BACK_TO_SCHOOL: Campaign = {
  id: 'back-to-school',
  name: 'Back to School 2025',
  status: 'active',
  startsAt: '2025-06-01T00:00:00+05:30',
  endsAt: '2025-07-31T23:59:59+05:30',
  audience: {
    audience: 'all',
    minAppVersion: '2.0.0',
    platforms: ['ios', 'android'],
    locales: ['en', 'hi'],
  },
  priority: 10,
  maxImpressionsPerUser: null,
  experimentId: 'exp-bts-2025',
  experimentVariant: 'control',
};

export const CAMPAIGN_SUMMER_PLAYHOUSE: Campaign = {
  id: 'summer-playhouse',
  name: 'Summer Playhouse 2025',
  status: 'active',
  startsAt: '2025-05-01T00:00:00+05:30',
  endsAt: '2025-07-31T23:59:59+05:30',
  audience: {
    audience: 'all',
    minAppVersion: '2.0.0',
    platforms: ['ios', 'android'],
  },
  priority: 8,
  maxImpressionsPerUser: null,
};

export const CAMPAIGN_MYSTERY_GIFT_CARNIVAL: Campaign = {
  id: 'mystery-gift-carnival',
  name: 'Mystery Gift Carnival',
  status: 'active',
  startsAt: '2025-06-15T00:00:00+05:30',
  endsAt: '2025-06-30T23:59:59+05:30',
  audience: {
    audience: 'returning_users',
    minAppVersion: '2.0.0',
  },
  priority: 15,
  maxImpressionsPerUser: 3,
  experimentId: 'exp-mgc-2025',
  experimentVariant: 'variant_a',
};

// ─────────────────────────────────────────────────────────────────────────────
// Promotions
// ─────────────────────────────────────────────────────────────────────────────

export const PROMO_BTS_FLAT200: Promotion = {
  id: 'promo-bts-flat200',
  campaignId: 'back-to-school',
  discountKind: 'flat',
  discountAmount: 200,
  minCartValue: 999,
  badge: {
    label: '₹200 OFF',
    subLabel: 'on orders above ₹999',
    color: '#1565C0',
    textColor: '#FFFFFF',
  },
  autoApply: false,
  couponCode: 'SCHOOL200',
  expiresAt: '2025-07-31T23:59:59+05:30',
};

export const PROMO_SUMMER_25PCT: Promotion = {
  id: 'promo-summer-25pct',
  campaignId: 'summer-playhouse',
  discountKind: 'percentage',
  discountPercent: 25,
  minCartValue: 799,
  maxDiscountCap: 500,
  badge: {
    label: 'FLAT 25% OFF',
    subLabel: 'use code SUMMER25',
    color: '#FF7043',
    textColor: '#FFFFFF',
  },
  autoApply: false,
  couponCode: 'SUMMER25',
  expiresAt: '2025-07-31T23:59:59+05:30',
};

export const PROMO_MYSTERY_BXGY: Promotion = {
  id: 'promo-mystery-bxgy',
  campaignId: 'mystery-gift-carnival',
  discountKind: 'mystery',
  minCartValue: 599,
  badge: {
    label: 'FREE GIFT',
    subLabel: 'on orders above ₹599',
    color: '#7B1FA2',
    textColor: '#FFFFFF',
  },
  autoApply: true,
  couponCode: null,
  expiresAt: '2025-06-30T23:59:59+05:30',
};

export const PROMO_FLASH_SALE_40PCT: Promotion = {
  id: 'promo-flash-40pct',
  campaignId: 'mystery-gift-carnival',
  discountKind: 'percentage',
  discountPercent: 40,
  maxDiscountCap: 800,
  badge: {
    label: '40% OFF',
    subLabel: 'today only',
    color: '#E53935',
    textColor: '#FFFFFF',
  },
  autoApply: false,
  couponCode: 'FLASH40',
  expiresAt: '2025-06-21T23:59:59+05:30',
};
