/**
 * campaigns/mysteryGiftCarnival.ts
 *
 * "Mystery Gift Carnival" campaign nodes.
 *
 * Contains:
 *  - 2 BANNER_HERO
 *  - 1 PRODUCT_GRID_2X2 (trending toys)
 *  - 2 DYNAMIC_COLLECTION (mystery gift row + banner mini-carousel)
 *  - 1 FULL_SCREEN_OVERLAY (mystery gift reveal interstitial)
 */
import type { SDUINode } from '@registry/types';
import type { BannerHeroData } from '@/types/components/BannerHero';
import type { ProductGrid2x2Data } from '@/types/components/ProductGrid2x2';
import type { DynamicCollectionData } from '@/types/components/DynamicCollection';
import type { FullScreenOverlayData } from '@/types/components/FullScreenOverlay';

import {
  CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
  PROMO_MYSTERY_BXGY,
} from '../fixtures/campaigns';
import { TOYS, ART_SUPPLIES } from '../fixtures/products';

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 1 — Main MGC hero
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_HERO_BANNER_1: SDUINode<BannerHeroData> = {
  id: 'mgc-hero-01',
  type: 'BANNER_HERO',
  analyticsLabel: 'mgc_hero_main',
  testID: 'banner-hero-mgc-main',
  data: {
    layout: 'overlay_center',
    height: 360,
    extendBehindStatusBar: true,
    media: {
      kind: 'lottie',
      lottieSource: 'https://assets.kiddo.mock/lottie/confetti-carnival-bg.json',
      image: {
        uri: 'https://images.kiddo.mock/banners/mgc-hero-main-2025.webp',
        alt: 'Mystery Gift Carnival',
        placeholder: 'LUOU[_~q?bxut7WBofM{j[j[WBof',
        resizeMode: 'cover',
        width: 1080,
        height: 720,
        srcSet: {
          '2x': 'https://images.kiddo.mock/banners/mgc-hero-main-2025@2x.webp',
          '3x': 'https://images.kiddo.mock/banners/mgc-hero-main-2025@3x.webp',
        },
      },
    },
    scrim: {
      kind: 'gradient',
      gradient: {
        type: 'radial',
        stops: [
          { color: 'rgba(0,0,0,0)', position: 0 },
          { color: 'rgba(0,0,0,0.55)', position: 1 },
        ],
      },
    },
    content: {
      eyebrowText: '🎪 MYSTERY GIFT CARNIVAL',
      eyebrowStyle: { color: '#FFD54F', weight: 'bold', size: 12, align: 'center' } as never,
      headline: 'Spend ₹599 &\nUnlock a Free Gift! 🎁',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 26, align: 'center' },
      subheadline: 'Every order is a surprise. What will you get?',
      subheadlineStyle: { color: 'rgba(255,255,255,0.88)', size: 14, align: 'center' },
    },
    primaryCTA: {
      label: '🎁 Reveal My Gift',
      action: {
        type: 'APPLY_MYSTERY_GIFT_COUPON',
        payload: {
          campaignId: 'mystery-gift-carnival',
          minCartValue: 599,
          successMessage: '🎉 Your mystery gift is on its way!',
          failureMessage: 'Add a little more to unlock your gift 🎁',
        },
      },
      theme: {
        variant: 'primary',
        size: 'lg',
        background: '#7B1FA2',
        textColor: '#FFFFFF',
        borderRadius: 24,
        loaderLottieSource: 'https://assets.kiddo.mock/lottie/gift-unwrap.json',
      },
      lottieSource: 'https://assets.kiddo.mock/lottie/sparkle-btn.json',
      accessibilityLabel: 'Reveal mystery gift',
    },
    secondaryCTA: {
      label: 'See All Offers',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/mystery-gift-carnival' } },
      theme: { variant: 'ghost', size: 'md', textColor: 'rgba(255,255,255,0.85)' },
    },
    promotion: PROMO_MYSTERY_BXGY,
    countdown: {
      endsAt: '2025-06-30T23:59:59+05:30',
      prefixLabel: 'Carnival ends in',
      expiredLabel: 'Carnival has ended 😢',
      hideOnExpiry: true,
    },
    countdownTheme: {
      background: 'rgba(123,31,162,0.5)',
      digitColor: '#FFD54F',
      labelColor: 'rgba(255,255,255,0.7)',
      separatorColor: '#CE93D8',
      borderRadius: 8,
      pulseOnUrgency: true,
    },
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    theme: {
      background: { kind: 'gradient', gradient: { type: 'linear', angle: 135, stops: [{ color: '#4A148C', position: 0 }, { color: '#880E4F', position: 1 }] } },
      borderRadius: 0,
      elevation: 0,
    },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'mystery-gift-carnival', position: 0, bannerType: 'hero_main' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 2 — "How it works" explainer strip
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_HERO_BANNER_2: SDUINode<BannerHeroData> = {
  id: 'mgc-hero-02',
  type: 'BANNER_HERO',
  analyticsLabel: 'mgc_hero_howto',
  data: {
    layout: 'media_top_text_bottom',
    height: 220,
    media: {
      kind: 'lottie',
      lottieSource: 'https://assets.kiddo.mock/lottie/gift-boxes-parade.json',
    },
    content: {
      eyebrowText: 'HOW IT WORKS',
      eyebrowStyle: { color: '#CE93D8', size: 11, weight: 'semiBold', transform: 'uppercase' } as never,
      headline: 'Shop → Checkout → Surprise!',
      headlineStyle: { color: '#212121', weight: 'bold', size: 18, align: 'center' },
      subheadline: '1. Add items worth ₹599+   2. Check out   3. Gift ships free with your order',
      subheadlineStyle: { color: '#616161', size: 13, align: 'center' },
    },
    primaryCTA: {
      label: 'Start Shopping',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/mystery-gift-carnival' } },
      theme: { variant: 'secondary', size: 'md', borderRadius: 8, background: '#F3E5F5', textColor: '#7B1FA2' },
    },
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    theme: {
      background: { kind: 'solid', color: '#FFFFFF' },
      borderRadius: 16,
      elevation: 2,
      padding: { top: 16, right: 16, bottom: 20, left: 16 },
    },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'mystery-gift-carnival', position: 1, bannerType: 'howto_strip' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Product Grid — Carnival picks
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_PRODUCT_GRID: SDUINode<ProductGrid2x2Data> = {
  id: 'mgc-grid-01',
  type: 'PRODUCT_GRID_2X2',
  analyticsLabel: 'mgc_product_grid',
  data: {
    header: {
      title: 'Carnival Picks 🎪',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      subtitle: 'Add any to qualify for a mystery gift',
      subtitleStyle: { color: '#7B1FA2', size: 13, weight: 'medium' },
      seeAllLabel: 'See All',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/mystery-gift-carnival' } },
    },
    items: [...TOYS, ...ART_SUPPLIES.slice(0, 4)],
    gutter: 10,
    cardTheme: {
      background: '#FFFFFF',
      borderRadius: 12,
      elevation: 2,
      imageAspectRatio: 1,
      contentPadding: { top: 8, right: 8, bottom: 10, left: 8 },
      bordered: true,
      borderColor: '#EDE7F6',
    },
    pagination: {
      mode: 'load_more',
      totalCount: TOYS.length + ART_SUPPLIES.length,
      pageSize: 10,
      loadMoreLabel: 'Load More Carnival Items',
      loadMoreButtonTheme: { variant: 'primary', size: 'md', background: '#7B1FA2', textColor: '#FFFFFF', borderRadius: 8 },
    },
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    theme: {
      background: { kind: 'gradient', gradient: { type: 'linear', angle: 180, stops: [{ color: '#F3E5F5', position: 0 }, { color: '#FFFFFF', position: 0.4 }] } },
      padding: { top: 16, right: 12, bottom: 16, left: 12 },
    },
    analytics: {
      impressionEvent: 'product_grid_viewed',
      tapEvent: 'product_grid_item_tapped',
      properties: { campaignId: 'mystery-gift-carnival', gridId: 'mgc-grid-01' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Mystery gift teaser row
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_MYSTERY_ROW: SDUINode<DynamicCollectionData> = {
  id: 'mgc-mystery-row-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'mgc_mystery_row',
  data: {
    collectionKind: 'mystery_gift',
    header: {
      title: '🎁 Mystery Gift Boxes',
      titleStyle: { color: '#4A148C', weight: 'bold', size: 18 },
      subtitle: 'Tap to reveal your surprise',
      subtitleStyle: { color: '#7B1FA2', size: 13 },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 150,
      itemHeight: 170,
      gutter: 12,
      leadingPadding: 16,
      snapToItem: true,
    },
    items: [
      {
        kind: 'mystery_gift', id: 'mg-01',
        teaserLabel: '🎁 Surprise #1',
        teaserImage: { uri: 'https://images.kiddo.mock/mystery/gift-box-purple.webp', alt: 'Mystery Gift Box', width: 300, height: 300 },
        revealLottieSource: 'https://assets.kiddo.mock/lottie/gift-unwrap-purple.json',
        action: { type: 'APPLY_MYSTERY_GIFT_COUPON', payload: { campaignId: 'mystery-gift-carnival', minCartValue: 599, successMessage: '🎉 Congrats! Your gift has been added!', failureMessage: 'Add ₹599+ to cart to unlock this gift' } },
        analytics: { tapEvent: 'mystery_gift_tapped', properties: { giftId: 'mg-01', campaignId: 'mystery-gift-carnival' } },
      },
      {
        kind: 'mystery_gift', id: 'mg-02',
        teaserLabel: '🎊 Surprise #2',
        teaserImage: { uri: 'https://images.kiddo.mock/mystery/gift-box-gold.webp', alt: 'Mystery Gold Box', width: 300, height: 300 },
        revealLottieSource: 'https://assets.kiddo.mock/lottie/gift-unwrap-gold.json',
        action: { type: 'APPLY_MYSTERY_GIFT_COUPON', payload: { campaignId: 'mystery-gift-carnival', minCartValue: 999, successMessage: '🌟 Premium gift unlocked!', failureMessage: 'Add ₹999+ to cart to unlock this premium gift' } },
        analytics: { tapEvent: 'mystery_gift_tapped', properties: { giftId: 'mg-02', campaignId: 'mystery-gift-carnival' } },
      },
      {
        kind: 'mystery_gift', id: 'mg-03',
        teaserLabel: '✨ Surprise #3',
        teaserImage: { uri: 'https://images.kiddo.mock/mystery/gift-box-rainbow.webp', alt: 'Rainbow Gift Box', width: 300, height: 300 },
        revealLottieSource: 'https://assets.kiddo.mock/lottie/gift-unwrap-rainbow.json',
        action: { type: 'APPLY_MYSTERY_GIFT_COUPON', payload: { campaignId: 'mystery-gift-carnival', minCartValue: 799 } },
        analytics: { tapEvent: 'mystery_gift_tapped', properties: { giftId: 'mg-03', campaignId: 'mystery-gift-carnival' } },
      },
    ],
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    cardTheme: { background: '#F3E5F5', borderRadius: 16, elevation: 3 },
    theme: { background: { kind: 'solid', color: '#FAF0FF' }, padding: { top: 8, right: 0, bottom: 8, left: 0 } },
    analytics: { impressionEvent: 'mystery_row_viewed', properties: { campaignId: 'mystery-gift-carnival' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Carnival mini-banners
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_MINI_BANNERS: SDUINode<DynamicCollectionData> = {
  id: 'mgc-mini-banners-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'mgc_mini_banners',
  data: {
    collectionKind: 'banner',
    header: {
      title: 'Featured Collections',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 200,
      itemHeight: 120,
      gutter: 12,
      leadingPadding: 16,
      autoAdvanceInterval: 5000,
      snapToItem: true,
      showScrollIndicator: true,
    },
    items: [
      { kind: 'banner', id: 'mgc-b-01', image: { uri: 'https://images.kiddo.mock/banners/mgc-toys-strip.webp', alt: 'Top Toys' }, title: 'Top Toys 🚀', subtitle: 'From ₹399', badge: { label: 'UP TO 40% OFF', theme: { variant: 'filled', background: '#E53935', textColor: '#FFFFFF', borderRadius: 4 } }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/toys' } }, analytics: { tapEvent: 'mini_banner_tapped', properties: { bannerId: 'mgc-b-01' } } },
      { kind: 'banner', id: 'mgc-b-02', image: { uri: 'https://images.kiddo.mock/banners/mgc-art-strip.webp', alt: 'Art Supplies' }, title: 'Art Supplies 🎨', subtitle: 'Create anything', action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/art-supplies' } }, analytics: { tapEvent: 'mini_banner_tapped', properties: { bannerId: 'mgc-b-02' } } },
      { kind: 'banner', id: 'mgc-b-03', image: { uri: 'https://images.kiddo.mock/banners/mgc-boardgames.webp', alt: 'Board Games' }, title: 'Board Games 🎲', subtitle: 'Family fun night', badge: { label: 'TRENDING', theme: { variant: 'filled', background: '#7B1FA2', textColor: '#FFFFFF', borderRadius: 4 } }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/board-games' } }, analytics: { tapEvent: 'mini_banner_tapped', properties: { bannerId: 'mgc-b-03' } } },
      { kind: 'banner', id: 'mgc-b-04', image: { uri: 'https://images.kiddo.mock/banners/mgc-outdoor.webp', alt: 'Outdoor Fun' }, title: 'Outdoor Fun 🌿', subtitle: 'Get active', action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/outdoor' } }, analytics: { tapEvent: 'mini_banner_tapped', properties: { bannerId: 'mgc-b-04' } } },
    ],
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    analytics: { impressionEvent: 'mini_banners_viewed', properties: { campaignId: 'mystery-gift-carnival' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-Screen Overlay — Mystery gift carnival interstitial
// ─────────────────────────────────────────────────────────────────────────────
export const MGC_MYSTERY_OVERLAY: SDUINode<FullScreenOverlayData> = {
  id: 'mgc-overlay-01',
  type: 'FULL_SCREEN_OVERLAY',
  analyticsLabel: 'mgc_mystery_overlay',
  data: {
    content: {
      kind: 'mystery_gift',
      headerMedia: {
        kind: 'lottie',
        lottie: { source: 'https://assets.kiddo.mock/lottie/confetti-gift-open.json', loop: false, autoPlay: true, speed: 1 },
        height: 260,
        background: { kind: 'gradient', gradient: { type: 'linear', angle: 135, stops: [{ color: '#4A148C', position: 0 }, { color: '#AD1457', position: 1 }] } },
      },
      headline: '🎁 You\'ve Won\na Mystery Gift!',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 28, align: 'center' },
      body: 'Spend ₹599 or more and we\'ll\nsend a free mystery gift with your order!',
      bodyStyle: { color: 'rgba(255,255,255,0.9)', size: 15, align: 'center' },
      mysteryGift: {
        campaignId: 'mystery-gift-carnival',
        teaserText: 'Unlock your mystery gift!',
        revealLottieSource: 'https://assets.kiddo.mock/lottie/gift-reveal-burst.json',
        minCartValue: 599,
        insufficientCartMessage: 'Add a bit more to your cart to reveal the gift! 🎁',
      },
      applyingLottie: { source: 'https://assets.kiddo.mock/lottie/gift-wrapping-loader.json', loop: true, autoPlay: true, speed: 1 },
      revealLottie: { source: 'https://assets.kiddo.mock/lottie/confetti-burst.json', loop: false, autoPlay: true, speed: 1 },
      primaryCTA: {
        label: '🎊 Unlock My Gift',
        action: {
          type: 'APPLY_MYSTERY_GIFT_COUPON',
          payload: {
            campaignId: 'mystery-gift-carnival',
            minCartValue: 599,
            successMessage: '🎉 Your mystery gift is on its way!',
            failureMessage: 'Add a little more to unlock your gift 🎁',
          },
        },
        theme: { variant: 'primary', size: 'full', background: '#FFD54F', textColor: '#4A148C', borderRadius: 12 },
        loaderLottieSource: 'https://assets.kiddo.mock/lottie/gift-wrapping-loader.json',
        accessibilityLabel: 'Unlock mystery gift',
      },
      secondaryCTA: {
        label: 'Skip for Now',
        action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://dismiss' } },
        theme: { variant: 'ghost', size: 'sm', textColor: 'rgba(255,255,255,0.6)' },
      },
      footerText: 'Gift value up to ₹299. T&C apply. One per order.',
      footerTextStyle: { color: 'rgba(255,255,255,0.5)', size: 11, align: 'center' },
    },
    trigger: { on: 'delay', delayMs: 3000 },
    dismissConfig: {
      mode: 'close_button',
      closeButtonPosition: 'top_right',
      onDismissAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://track/overlay_dismissed', params: { overlayId: 'mgc-overlay-01' } } },
    },
    overlayTheme: {
      scrimColor: 'rgba(74,20,140,0.75)',
      scrimOpacity: 0.75,
      contentBackground: { kind: 'gradient', gradient: { type: 'linear', angle: 180, stops: [{ color: '#4A148C', position: 0 }, { color: '#AD1457', position: 1 }] } },
      borderRadius: 24,
      enterAnimation: 'zoom',
      exitAnimation: 'fade',
      animationDuration: 450,
    },
    campaign: CAMPAIGN_MYSTERY_GIFT_CARNIVAL,
    showOncePerSession: true,
    visibility: {
      logic: 'AND',
      conditions: [
        { storeKey: 'isAuthenticated', operator: 'eq', value: true },
      ],
    },
    analytics: {
      impressionEvent: 'overlay_viewed',
      tapEvent: 'overlay_cta_tapped',
      properties: { campaignId: 'mystery-gift-carnival', overlayId: 'mgc-overlay-01', type: 'mystery_gift' },
    },
  },
};

export const MYSTERY_GIFT_CARNIVAL_NODES: SDUINode[] = [
  MGC_HERO_BANNER_1 as unknown as SDUINode,
  MGC_MYSTERY_ROW as unknown as SDUINode,
  MGC_HERO_BANNER_2 as unknown as SDUINode,
  MGC_MINI_BANNERS as unknown as SDUINode,
  MGC_PRODUCT_GRID as unknown as SDUINode,
  MGC_MYSTERY_OVERLAY as unknown as SDUINode,
];
