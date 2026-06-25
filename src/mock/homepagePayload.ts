/**
 * homepagePayload.ts
 *
 * Production-grade mock of what the /pages/home API endpoint returns.
 *
 * ┌─────────────────────────────────────────────────────────────┐
 * │  CAMPAIGN SWITCHING                                         │
 * │  Change only: meta.activeCampaignId                        │
 * │  e.g.  "back-to-school"                                    │
 * │        "summer-playhouse"                                  │
 * │        "mystery-gift-carnival"                             │
 * │  The renderer reads activeCampaignId from meta and picks   │
 * │  the right campaign node block. Zero renderer code change. │
 * └─────────────────────────────────────────────────────────────┘
 *
 * Node order in the final page (top → bottom):
 *  1.  FULL_SCREEN_OVERLAY          (campaign overlay — triggers on load)
 *  2.  BANNER_HERO                  (campaign hero banner)
 *  3.  DYNAMIC_COLLECTION (cats)    (category chips row)
 *  4.  BANNER_HERO                  (secondary campaign strip)
 *  5.  DYNAMIC_COLLECTION (brands)  (brand / activity row)
 *  6.  BANNER_HERO × 3             (persistent editorial banners)
 *  7.  PRODUCT_GRID_2X2            (campaign product grid)
 *  8.  DYNAMIC_COLLECTION (products)(trending horizontal scroll)
 *  9.  BANNER_HERO                  (art supplies editorial)
 *  10. DYNAMIC_COLLECTION (banners) (mini-banner carousel)
 *  11. BANNER_HERO × 2             (app download + refer & earn)
 *  ??. INVALID NODES               (intentional — test renderer resilience)
 */

import type { SDUIPageResponse } from '@/types/sdui';
import type { SDUINode } from '@registry/types';
import type { BannerHeroData } from '@/types/components/BannerHero';
import type { DynamicCollectionData } from '@/types/components/DynamicCollection';

import { BACK_TO_SCHOOL_NODES } from './campaigns/backToSchool';
import { SUMMER_PLAYHOUSE_NODES } from './campaigns/summerPlayhouse';
import { MYSTERY_GIFT_CARNIVAL_NODES } from './campaigns/mysteryGiftCarnival';
import { PRODUCTS, TOYS, ART_SUPPLIES, STATIONERY } from './fixtures/products';

// ─────────────────────────────────────────────────────────────────────────────
// Active campaign selector
// Change THIS ID to switch campaigns without touching anything else.
// ─────────────────────────────────────────────────────────────────────────────
const ACTIVE_CAMPAIGN_ID = 'back-to-school' as
  | 'back-to-school'
  | 'summer-playhouse'
  | 'mystery-gift-carnival';

const CAMPAIGN_NODES: Record<typeof ACTIVE_CAMPAIGN_ID, SDUINode[]> = {
  'back-to-school': BACK_TO_SCHOOL_NODES,
  'summer-playhouse': SUMMER_PLAYHOUSE_NODES,
  'mystery-gift-carnival': MYSTERY_GIFT_CARNIVAL_NODES,
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistent editorial banners (always shown, campaign-independent)
// ─────────────────────────────────────────────────────────────────────────────

const EDITORIAL_BANNER_NEW_ARRIVALS: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-new-arrivals',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_new_arrivals',
  data: {
    layout: 'overlay_bottom_left',
    height: 220,
    media: {
      kind: 'image',
      image: {
        uri: 'https://images.kiddo.mock/banners/editorial-new-arrivals.webp',
        alt: 'New Arrivals — Just Landed',
        placeholder: 'LBO_]?~q~qt7_3t7M{WBt6ofWBof',
        resizeMode: 'cover',
        width: 1080,
        height: 440,
        srcSet: { '2x': 'https://images.kiddo.mock/banners/editorial-new-arrivals@2x.webp' },
      },
    },
    scrim: { kind: 'gradient', gradient: { type: 'linear', angle: 0, stops: [{ color: 'rgba(0,0,0,0)', position: 0.3 }, { color: 'rgba(0,0,0,0.7)', position: 1 }] } },
    content: {
      eyebrowText: '✨ JUST LANDED',
      headline: 'New Arrivals\nThis Week',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 22 },
      subheadline: 'Fresh picks across all categories',
      subheadlineStyle: { color: 'rgba(255,255,255,0.85)', size: 13 },
    },
    primaryCTA: {
      label: 'Explore',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://collection/new-arrivals', fallbackRoute: '/(tabs)/search' } },
      theme: { variant: 'primary', size: 'sm', background: '#FFFFFF', textColor: '#212121', borderRadius: 6 },
    },
    theme: { borderRadius: 12, elevation: 2 },
    analytics: { impressionEvent: 'editorial_banner_viewed', tapEvent: 'editorial_banner_tapped', properties: { bannerId: 'new-arrivals' } },
  },
};

const EDITORIAL_BANNER_TRENDING: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-trending',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_trending',
  data: {
    layout: 'split_right',
    height: 160,
    media: {
      kind: 'image',
      image: { uri: 'https://images.kiddo.mock/banners/editorial-trending-lego.webp', alt: 'Trending — LEGO Sets', resizeMode: 'cover', width: 540, height: 320 },
    },
    content: {
      eyebrowText: '🔥 TRENDING',
      headline: 'LEGO & Building Sets',
      headlineStyle: { color: '#212121', weight: 'extraBold', size: 18 },
      subheadline: 'Most-loved builds of the season',
      subheadlineStyle: { color: '#616161', size: 13 },
    },
    primaryCTA: {
      label: 'Shop LEGO',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/lego', fallbackRoute: '/(tabs)/search' } },
      theme: { variant: 'primary', size: 'sm', background: '#FFCB02', textColor: '#000000', borderRadius: 6 },
    },
    theme: { background: { kind: 'solid', color: '#FFFDE7' }, borderRadius: 12, elevation: 1, padding: { top: 16, right: 12, bottom: 16, left: 16 } },
    analytics: { impressionEvent: 'editorial_banner_viewed', tapEvent: 'editorial_banner_tapped', properties: { bannerId: 'trending-lego' } },
  },
};

const EDITORIAL_BANNER_GIFTING: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-gifting',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_gifting',
  data: {
    layout: 'overlay_center',
    height: 180,
    media: {
      kind: 'image',
      image: { uri: 'https://images.kiddo.mock/banners/editorial-gifting.webp', alt: 'Gift Ideas for Kids', resizeMode: 'cover', width: 1080, height: 360 },
    },
    scrim: { kind: 'gradient', gradient: { type: 'radial', stops: [{ color: 'rgba(0,0,0,0)', position: 0 }, { color: 'rgba(0,0,0,0.6)', position: 1 }] } },
    content: {
      eyebrowText: '🎀 GIFTING GUIDE',
      headline: 'Perfect Gifts\nUnder ₹999',
      headlineStyle: { color: '#FFFFFF', weight: 'bold', size: 20, align: 'center' },
    },
    primaryCTA: {
      label: 'Find a Gift',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://collection/gifts-under-999' } },
      theme: { variant: 'primary', size: 'sm', background: '#E91E63', textColor: '#FFFFFF', borderRadius: 20 },
    },
    theme: { borderRadius: 12, elevation: 2 },
    analytics: { impressionEvent: 'editorial_banner_viewed', tapEvent: 'editorial_banner_tapped', properties: { bannerId: 'gifting-under-999' } },
  },
};

const EDITORIAL_BANNER_ART: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-art',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_art',
  data: {
    layout: 'split_left',
    height: 160,
    media: {
      kind: 'image',
      image: { uri: 'https://images.kiddo.mock/banners/editorial-art-supplies.webp', alt: 'Art & Craft Supplies', resizeMode: 'cover', width: 540, height: 320 },
    },
    content: {
      eyebrowText: '🎨 ART CORNER',
      headline: 'Spark Their\nCreativity',
      headlineStyle: { color: '#1A237E', weight: 'extraBold', size: 18 },
      subheadline: 'Premium art supplies for young artists',
      subheadlineStyle: { color: '#424242', size: 13 },
    },
    primaryCTA: {
      label: 'Shop Art',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/art-supplies' } },
      theme: { variant: 'primary', size: 'sm', background: '#7986CB', textColor: '#FFFFFF', borderRadius: 6 },
    },
    theme: { background: { kind: 'solid', color: '#E8EAF6' }, borderRadius: 12, elevation: 1, padding: { top: 16, right: 12, bottom: 16, left: 16 } },
    analytics: { impressionEvent: 'editorial_banner_viewed', tapEvent: 'editorial_banner_tapped', properties: { bannerId: 'art-corner' } },
  },
};

const EDITORIAL_BANNER_APP_DOWNLOAD: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-app-download',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_app_download',
  data: {
    layout: 'overlay_bottom_left',
    height: 140,
    media: {
      kind: 'image',
      image: { uri: 'https://images.kiddo.mock/banners/editorial-app-download.webp', alt: 'Download Kiddo App', resizeMode: 'cover', width: 1080, height: 280 },
    },
    scrim: { kind: 'gradient', gradient: { type: 'linear', angle: 90, stops: [{ color: 'rgba(0,0,0,0.6)', position: 0 }, { color: 'rgba(0,0,0,0)', position: 1 }] } },
    content: {
      eyebrowText: '📱 KIDDO APP',
      headline: 'Exclusive App-Only Deals',
      headlineStyle: { color: '#FFFFFF', weight: 'bold', size: 16 },
      subheadline: 'Extra 10% off + faster checkout',
      subheadlineStyle: { color: 'rgba(255,255,255,0.85)', size: 12 },
    },
    primaryCTA: {
      label: 'Download Now',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://app-download', fallbackRoute: '/(tabs)/profile' } },
      theme: { variant: 'primary', size: 'xs', background: '#43A047', textColor: '#FFFFFF', borderRadius: 6 },
    },
    theme: { borderRadius: 10, elevation: 1 },
    analytics: { impressionEvent: 'app_download_banner_viewed', tapEvent: 'app_download_banner_tapped', properties: { bannerId: 'app-download' } },
  },
};

const EDITORIAL_BANNER_REFER: SDUINode<BannerHeroData> = {
  id: 'editorial-banner-refer',
  type: 'BANNER_HERO',
  analyticsLabel: 'editorial_refer_earn',
  data: {
    layout: 'split_right',
    height: 140,
    media: {
      kind: 'lottie',
      lottieSource: 'https://assets.kiddo.mock/lottie/refer-friends.json',
    },
    content: {
      eyebrowText: '💰 REFER & EARN',
      headline: 'Give ₹100, Get ₹100',
      headlineStyle: { color: '#212121', weight: 'bold', size: 16 },
      subheadline: 'Invite friends and earn Kiddo credits',
      subheadlineStyle: { color: '#616161', size: 12 },
    },
    primaryCTA: {
      label: 'Invite Friends',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://refer-earn', fallbackRoute: '/(tabs)/profile' } },
      theme: { variant: 'primary', size: 'xs', background: '#00897B', textColor: '#FFFFFF', borderRadius: 6 },
    },
    theme: { background: { kind: 'solid', color: '#E0F2F1' }, borderRadius: 10, elevation: 1, padding: { top: 12, right: 12, bottom: 12, left: 16 } },
    analytics: { impressionEvent: 'refer_banner_viewed', tapEvent: 'refer_banner_tapped', properties: { bannerId: 'refer-earn' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Persistent collections (always shown)
// ─────────────────────────────────────────────────────────────────────────────

const TRENDING_TOYS_CAROUSEL: SDUINode<DynamicCollectionData> = {
  id: 'trending-toys-carousel',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'trending_toys_carousel',
  data: {
    collectionKind: 'product',
    header: {
      title: 'Trending Toys 🚀',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      subtitle: 'Kids are loving these right now',
      subtitleStyle: { color: '#757575', size: 13 },
      seeAllLabel: 'See All',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/toys', fallbackRoute: '/(tabs)/search' } },
    },
    layout: { scrollDirection: 'horizontal', itemWidth: 152, itemHeight: 232, gutter: 10, leadingPadding: 16 },
    items: TOYS.map(p => ({ ...p, kind: 'product' as const })),
    cardTheme: { background: '#FFFFFF', borderRadius: 10, elevation: 1, imageAspectRatio: 1, bordered: true, borderColor: '#F0F0F0' },
    analytics: { impressionEvent: 'trending_toys_carousel_viewed', properties: { section: 'trending_toys' } },
  },
};

const ART_SUPPLIES_CAROUSEL: SDUINode<DynamicCollectionData> = {
  id: 'art-supplies-carousel',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'art_supplies_carousel',
  data: {
    collectionKind: 'product',
    header: {
      title: 'Art & Craft 🎨',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      seeAllLabel: 'See All',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/art-supplies' } },
    },
    layout: { scrollDirection: 'horizontal', itemWidth: 152, itemHeight: 232, gutter: 10, leadingPadding: 16 },
    items: ART_SUPPLIES.map(p => ({ ...p, kind: 'product' as const })),
    cardTheme: { background: '#FFFFFF', borderRadius: 10, elevation: 1, imageAspectRatio: 1 },
    analytics: { impressionEvent: 'art_supplies_carousel_viewed', properties: { section: 'art_supplies' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Intentionally invalid nodes — test renderer resilience
// ─────────────────────────────────────────────────────────────────────────────
// These nodes have types not registered in the ComponentRegistry.
// The SDUIRenderer should degrade gracefully (show a yellow dev warning,
// render nothing in production) rather than throw.

const INVALID_NODE_UNKNOWN_TYPE = {
  id: 'invalid-node-01',
  type: 'NEW_COMPONENT_V2',          // ← not a valid ComponentTypeKey
  analyticsLabel: 'invalid_unknown_type',
  data: { message: 'This type is not yet registered. Renderer should handle gracefully.' },
} as unknown as SDUINode;

const INVALID_NODE_FUTURE_WIDGET = {
  id: 'invalid-node-02',
  type: 'AI_RECOMMENDATION_STRIP',   // ← future feature, not yet shipped
  analyticsLabel: 'invalid_future_widget',
  data: {
    model: 'kiddo-rec-v3',
    userId: '{{user.id}}',
    placeholderItems: 6,
  },
} as unknown as SDUINode;

const INVALID_NODE_MALFORMED_DATA = {
  id: 'invalid-node-03',
  type: 'BANNER_HERO',              // ← valid type but data is malformed / missing required fields
  analyticsLabel: 'invalid_malformed_data',
  data: {
    // missing required `layout`, `media`, `content`, `primaryCTA`
    height: 200,
  },
} as unknown as SDUINode;

// ─────────────────────────────────────────────────────────────────────────────
// Page assembler
// ─────────────────────────────────────────────────────────────────────────────

const campaignNodes = CAMPAIGN_NODES[ACTIVE_CAMPAIGN_ID];

// Overlay always comes first (position: absolute, renders over everything)
const [campaignOverlay, ...restCampaignNodes] = campaignNodes;

/**
 * Final ordered node array — mirrors what the real backend would return.
 * FlashList receives this as its data prop.
 */
const PAGE_NODES: SDUINode[] = [
  // 1. Campaign overlay (triggers on load / delay)
  campaignOverlay!,

  // 2–5. Campaign-specific hero + collections
  ...restCampaignNodes,

  // 6–8. Persistent editorial banners
  EDITORIAL_BANNER_NEW_ARRIVALS as unknown as SDUINode,
  EDITORIAL_BANNER_TRENDING as unknown as SDUINode,
  EDITORIAL_BANNER_GIFTING as unknown as SDUINode,

  // 9. Trending toys (persistent)
  TRENDING_TOYS_CAROUSEL as unknown as SDUINode,

  // 10. Art & craft carousel
  EDITORIAL_BANNER_ART as unknown as SDUINode,
  ART_SUPPLIES_CAROUSEL as unknown as SDUINode,

  // 11. App promo + refer & earn
  EDITORIAL_BANNER_APP_DOWNLOAD as unknown as SDUINode,
  EDITORIAL_BANNER_REFER as unknown as SDUINode,

  // 12–14. Intentionally invalid nodes (renderer resilience)
  INVALID_NODE_UNKNOWN_TYPE,
  INVALID_NODE_FUTURE_WIDGET,
  INVALID_NODE_MALFORMED_DATA,
];

// ─────────────────────────────────────────────────────────────────────────────
// Final API response envelope
// ─────────────────────────────────────────────────────────────────────────────

/**
 * homepagePayload
 *
 * Drop-in mock for what GET /pages/home returns.
 *
 * To switch campaigns, change `activeCampaignId` in `meta`
 * AND `ACTIVE_CAMPAIGN_ID` above.
 */
export const homepagePayload: SDUIPageResponse = {
  pageId: 'home',
  version: 12,
  ttl: 300,   // 5 minutes — client caches this response
  nodes: PAGE_NODES,
  meta: {
    // ── Campaign control ──────────────────────────────────────────
    activeCampaignId: ACTIVE_CAMPAIGN_ID,
    availableCampaigns: Object.keys(CAMPAIGN_NODES),

    // ── Page identity ─────────────────────────────────────────────
    pageTitle: 'Home',
    pageAnalyticsName: 'home_feed',

    // ── Feed stats (useful for FlashList estimatedItemSize) ───────
    totalNodeCount: PAGE_NODES.length,
    totalProductCount: PRODUCTS.length,

    // ── Feature flags ─────────────────────────────────────────────
    features: {
      overlaysEnabled: true,
      mysteryGiftEnabled: true,
      flashListEnabled: true,
      darkModeEnabled: true,
    },

    // ── Response metadata ─────────────────────────────────────────
    generatedAt: '2025-06-20T10:00:00+05:30',
    environment: 'mock',
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Named exports for testing
// ─────────────────────────────────────────────────────────────────────────────
export { ACTIVE_CAMPAIGN_ID, PAGE_NODES, CAMPAIGN_NODES };
export { INVALID_NODE_UNKNOWN_TYPE, INVALID_NODE_FUTURE_WIDGET, INVALID_NODE_MALFORMED_DATA };
