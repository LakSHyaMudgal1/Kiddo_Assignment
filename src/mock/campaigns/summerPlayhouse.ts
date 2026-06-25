/**
 * campaigns/summerPlayhouse.ts
 *
 * "Summer Playhouse 2025" campaign nodes.
 *
 * Contains:
 *  - 2 BANNER_HERO
 *  - 1 PRODUCT_GRID_2X2 (toys + outdoor)
 *  - 2 DYNAMIC_COLLECTION (product row + category chips)
 *  - 1 FULL_SCREEN_OVERLAY (flash sale countdown)
 */
import type { SDUINode } from '@registry/types';
import type { BannerHeroData } from '@/types/components/BannerHero';
import type { ProductGrid2x2Data } from '@/types/components/ProductGrid2x2';
import type { DynamicCollectionData } from '@/types/components/DynamicCollection';
import type { FullScreenOverlayData } from '@/types/components/FullScreenOverlay';

import {
  CAMPAIGN_SUMMER_PLAYHOUSE,
  PROMO_SUMMER_25PCT,
  PROMO_FLASH_SALE_40PCT,
} from '../fixtures/campaigns';
import { TOYS, OUTDOOR_SPORTS, SUMMER_PRODUCTS, APPAREL } from '../fixtures/products';

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 1 — Main Summer hero
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_HERO_BANNER_1: SDUINode<BannerHeroData> = {
  id: 'summer-hero-01',
  type: 'BANNER_HERO',
  analyticsLabel: 'summer_hero_main',
  testID: 'banner-hero-summer-main',
  data: {
    layout: 'overlay_bottom_left',
    height: 340,
    extendBehindStatusBar: true,
    colorTint: 'rgba(255,112,0,0.08)',
    media: {
      kind: 'image',
      image: {
        uri: 'https://images.kiddo.mock/banners/summer-hero-main-2025.webp',
        alt: 'Summer Playhouse 2025 — Play Big This Summer',
        placeholder: 'LBOG_s~q_N%M_Nt6t7-;xuj[ofj[',
        resizeMode: 'cover',
        width: 1080,
        height: 680,
        srcSet: {
          '2x': 'https://images.kiddo.mock/banners/summer-hero-main-2025@2x.webp',
          '3x': 'https://images.kiddo.mock/banners/summer-hero-main-2025@3x.webp',
        },
      },
    },
    scrim: {
      kind: 'gradient',
      gradient: {
        type: 'linear',
        angle: 0,
        stops: [
          { color: 'rgba(0,0,0,0)', position: 0 },
          { color: 'rgba(0,0,0,0.65)', position: 1 },
        ],
      },
    },
    content: {
      eyebrowText: 'SUMMER PLAYHOUSE 2025',
      eyebrowStyle: { color: '#FFE082', weight: 'bold', size: 11, transform: 'uppercase' } as never,
      headline: 'Play Big\nThis Summer ☀️',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 28 },
      subheadline: 'Toys, cycles, art kits & more — flat 25% off',
      subheadlineStyle: { color: 'rgba(255,255,255,0.85)', size: 14 },
    },
    primaryCTA: {
      label: 'Shop Summer Deals',
      action: {
        type: 'DEEP_LINK',
        payload: {
          uri: 'kiddo://campaign/summer-playhouse',
          fallbackRoute: '/(tabs)/search',
          params: { campaignId: 'summer-playhouse' },
        },
      },
      theme: { variant: 'primary', size: 'md', background: '#FF7043', textColor: '#FFFFFF', borderRadius: 8 },
      accessibilityLabel: 'Shop Summer Playhouse deals',
    },
    secondaryCTA: {
      label: 'Browse Toys',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/toys', fallbackRoute: '/(tabs)/search' } },
      theme: { variant: 'ghost', size: 'md', textColor: '#FFFFFF', borderRadius: 8 },
    },
    promotion: PROMO_SUMMER_25PCT,
    countdown: {
      endsAt: '2025-07-31T23:59:59+05:30',
      prefixLabel: 'Sale ends in',
      expiredLabel: 'Sale Ended',
      hideOnExpiry: false,
    },
    countdownTheme: {
      background: 'rgba(0,0,0,0.4)',
      digitColor: '#FFFFFF',
      labelColor: 'rgba(255,255,255,0.7)',
      separatorColor: '#FF7043',
      borderRadius: 6,
      pulseOnUrgency: true,
    },
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    theme: { background: { kind: 'solid', color: '#E65100' }, borderRadius: 0, elevation: 0 },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'summer-playhouse', position: 0, bannerType: 'hero_main' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 2 — Outdoor fun strip
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_HERO_BANNER_2: SDUINode<BannerHeroData> = {
  id: 'summer-hero-02',
  type: 'BANNER_HERO',
  analyticsLabel: 'summer_hero_outdoor',
  data: {
    layout: 'split_left',
    height: 180,
    media: {
      kind: 'image',
      image: {
        uri: 'https://images.kiddo.mock/banners/summer-outdoor-strip.webp',
        alt: 'Outdoor & Sports',
        resizeMode: 'cover',
        width: 540,
        height: 360,
      },
    },
    content: {
      eyebrowText: 'OUTDOOR & SPORTS',
      headline: 'Get Outside\n& Play! 🏏',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 20 },
      subheadline: 'Cycles, cricket sets, skates from ₹499',
      subheadlineStyle: { color: 'rgba(255,255,255,0.85)', size: 13 },
    },
    scrim: {
      kind: 'gradient',
      gradient: {
        type: 'linear',
        angle: 90,
        stops: [
          { color: 'rgba(0,0,0,0.7)', position: 0 },
          { color: 'rgba(0,0,0,0)', position: 1 },
        ],
      },
    },
    primaryCTA: {
      label: 'Explore Sports',
      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/outdoor-sports', fallbackRoute: '/(tabs)/search' } },
      theme: { variant: 'primary', size: 'sm', background: '#FF7043', textColor: '#FFFFFF', borderRadius: 6 },
    },
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    theme: { background: { kind: 'solid', color: '#BF360C' }, borderRadius: 12, elevation: 2 },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'summer-playhouse', position: 1, bannerType: 'outdoor_strip' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Product Grid — Summer hits
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_PRODUCT_GRID: SDUINode<ProductGrid2x2Data> = {
  id: 'summer-grid-01',
  type: 'PRODUCT_GRID_2X2',
  analyticsLabel: 'summer_product_grid',
  data: {
    header: {
      title: 'Summer Bestsellers 🔥',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      subtitle: 'Flat 25% off with code SUMMER25',
      subtitleStyle: { color: '#FF7043', size: 13, weight: 'medium' },
      seeAllLabel: 'See All',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/summer-playhouse' } },
    },
    items: [...SUMMER_PRODUCTS, ...TOYS.slice(0, 4)],
    gutter: 10,
    cardTheme: {
      background: '#FFFFFF',
      borderRadius: 12,
      elevation: 1,
      imageAspectRatio: 1,
      contentPadding: { top: 8, right: 8, bottom: 10, left: 8 },
      bordered: false,
    },
    pagination: {
      mode: 'see_all',
      totalCount: OUTDOOR_SPORTS.length + TOYS.length,
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/summer-playhouse' } },
    },
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    theme: {
      background: { kind: 'solid', color: '#FFF8F6' },
      padding: { top: 16, right: 12, bottom: 16, left: 12 },
    },
    analytics: {
      impressionEvent: 'product_grid_viewed',
      tapEvent: 'product_grid_item_tapped',
      properties: { campaignId: 'summer-playhouse', gridId: 'summer-grid-01' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Summer product carousel
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_PRODUCT_CAROUSEL: SDUINode<DynamicCollectionData> = {
  id: 'summer-carousel-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'summer_product_carousel',
  data: {
    collectionKind: 'product',
    header: {
      title: 'Trending This Summer',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      seeAllLabel: 'See All',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/outdoor-sports' } },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 160,
      itemHeight: 240,
      gutter: 12,
      leadingPadding: 16,
      snapToItem: false,
    },
    items: OUTDOOR_SPORTS.map(p => ({ ...p, kind: 'product' as const })),
    cardTheme: { background: '#FFFFFF', borderRadius: 10, elevation: 1, imageAspectRatio: 1 },
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    analytics: { impressionEvent: 'product_carousel_viewed', properties: { campaignId: 'summer-playhouse' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Summer activity banners
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_ACTIVITY_BANNERS: SDUINode<DynamicCollectionData> = {
  id: 'summer-act-banners-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'summer_activity_banners',
  data: {
    collectionKind: 'banner',
    header: {
      title: 'Pick Your Activity',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 220,
      itemHeight: 130,
      gutter: 12,
      leadingPadding: 16,
      snapToItem: true,
      autoAdvanceInterval: 4000,
      showScrollIndicator: true,
    },
    items: [
      { kind: 'banner', id: 'sab-01', image: { uri: 'https://images.kiddo.mock/banners/summer-cycling.webp', alt: 'Cycling', width: 440, height: 260 }, title: 'Ride & Explore 🚴', badge: { label: 'Up to 20% off', theme: { variant: 'filled', background: '#FF7043', textColor: '#FFFFFF', borderRadius: 4 } }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/cycles' } }, analytics: { tapEvent: 'banner_tapped', properties: { bannerId: 'sab-01' } } },
      { kind: 'banner', id: 'sab-02', image: { uri: 'https://images.kiddo.mock/banners/summer-cricket.webp', alt: 'Cricket', width: 440, height: 260 }, title: 'Hit a Six 🏏', badge: { label: 'NEW', theme: { variant: 'filled', background: '#2196F3', textColor: '#FFFFFF', borderRadius: 4 } }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/cricket' } }, analytics: { tapEvent: 'banner_tapped', properties: { bannerId: 'sab-02' } } },
      { kind: 'banner', id: 'sab-03', image: { uri: 'https://images.kiddo.mock/banners/summer-painting.webp', alt: 'Painting', width: 440, height: 260 }, title: 'Create & Color 🎨', action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/art-supplies' } }, analytics: { tapEvent: 'banner_tapped', properties: { bannerId: 'sab-03' } } },
      { kind: 'banner', id: 'sab-04', image: { uri: 'https://images.kiddo.mock/banners/summer-swimming.webp', alt: 'Swimming', width: 440, height: 260 }, title: 'Splash & Play 🏊', badge: { label: 'HOT', theme: { variant: 'filled', background: '#E53935', textColor: '#FFFFFF', borderRadius: 4 } }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/swim' } }, analytics: { tapEvent: 'banner_tapped', properties: { bannerId: 'sab-04' } } },
      { kind: 'banner', id: 'sab-05', image: { uri: 'https://images.kiddo.mock/banners/summer-kite.webp', alt: 'Kite Flying', width: 440, height: 260 }, title: 'Fly High 🪁', action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/kites' } }, analytics: { tapEvent: 'banner_tapped', properties: { bannerId: 'sab-05' } } },
    ],
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    analytics: { impressionEvent: 'activity_banners_viewed', properties: { campaignId: 'summer-playhouse' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-Screen Overlay — Flash sale countdown
// ─────────────────────────────────────────────────────────────────────────────
export const SUMMER_FLASH_OVERLAY: SDUINode<FullScreenOverlayData> = {
  id: 'summer-overlay-01',
  type: 'FULL_SCREEN_OVERLAY',
  analyticsLabel: 'summer_flash_overlay',
  data: {
    content: {
      kind: 'flash_sale',
      headerMedia: {
        kind: 'lottie',
        lottie: { source: 'https://assets.kiddo.mock/lottie/flash-sale-sun.json', loop: true, autoPlay: true, speed: 1 },
        height: 220,
        background: { kind: 'gradient', gradient: { type: 'linear', angle: 135, stops: [{ color: '#FF7043', position: 0 }, { color: '#FF5722', position: 1 }] } },
      },
      headline: '⚡ Flash Sale — 40% OFF',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 28, align: 'center' },
      body: 'Hurry! This deal expires today.\nUse code FLASH40 at checkout.',
      bodyStyle: { color: 'rgba(255,255,255,0.9)', size: 15, align: 'center' },
      countdown: {
        endsAt: '2025-06-21T23:59:59+05:30',
        prefixLabel: 'Ends in',
        expiredLabel: 'Sale has ended',
        hideOnExpiry: true,
      },
      countdownTheme: {
        background: 'rgba(0,0,0,0.25)',
        digitColor: '#FFFFFF',
        separatorColor: '#FFE082',
        borderRadius: 8,
        pulseOnUrgency: true,
      },
      promotion: PROMO_FLASH_SALE_40PCT,
      primaryCTA: {
        label: '🛒 Shop Flash Deals',
        action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/summer-playhouse', params: { coupon: 'FLASH40' } } },
        theme: { variant: 'primary', size: 'full', background: '#FFFFFF', textColor: '#E53935', borderRadius: 10 },
      },
      secondaryCTA: {
        label: 'Dismiss',
        action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://dismiss' } },
        theme: { variant: 'ghost', size: 'md', textColor: 'rgba(255,255,255,0.7)' },
      },
      footerText: 'Max discount ₹800. T&C apply.',
      footerTextStyle: { color: 'rgba(255,255,255,0.6)', size: 11, align: 'center' },
    },
    trigger: { on: 'page_load' },
    dismissConfig: { mode: 'close_button', closeButtonPosition: 'top_right' },
    overlayTheme: {
      scrimColor: 'rgba(0,0,0,0.7)',
      scrimOpacity: 0.7,
      contentBackground: { kind: 'gradient', gradient: { type: 'linear', angle: 180, stops: [{ color: '#FF7043', position: 0 }, { color: '#BF360C', position: 1 }] } },
      borderRadius: 20,
      enterAnimation: 'zoom',
      exitAnimation: 'fade',
      animationDuration: 400,
    },
    campaign: CAMPAIGN_SUMMER_PLAYHOUSE,
    showOncePerSession: true,
    analytics: {
      impressionEvent: 'overlay_viewed',
      tapEvent: 'overlay_cta_tapped',
      properties: { campaignId: 'summer-playhouse', overlayId: 'summer-overlay-01', type: 'flash_sale' },
    },
  },
};

export const SUMMER_PLAYHOUSE_NODES: SDUINode[] = [
  SUMMER_HERO_BANNER_1 as unknown as SDUINode,
  SUMMER_ACTIVITY_BANNERS as unknown as SDUINode,
  SUMMER_HERO_BANNER_2 as unknown as SDUINode,
  SUMMER_PRODUCT_CAROUSEL as unknown as SDUINode,
  SUMMER_PRODUCT_GRID as unknown as SDUINode,
  SUMMER_FLASH_OVERLAY as unknown as SDUINode,
];
