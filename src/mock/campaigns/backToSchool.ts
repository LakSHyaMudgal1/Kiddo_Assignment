/**
 * campaigns/backToSchool.ts
 *
 * "Back to School 2025" campaign nodes.
 *
 * Contains:
 *  - 2 BANNER_HERO nodes
 *  - 1 PRODUCT_GRID_2X2 (stationery + apparel)
 *  - 2 DYNAMIC_COLLECTION (category chips + brand row)
 *  - 1 FULL_SCREEN_OVERLAY (promotional interstitial)
 */
import type { SDUINode } from '@registry/types';
import type { BannerHeroData } from '@/types/components/BannerHero';
import type { ProductGrid2x2Data } from '@/types/components/ProductGrid2x2';
import type { DynamicCollectionData } from '@/types/components/DynamicCollection';
import type { FullScreenOverlayData } from '@/types/components/FullScreenOverlay';

import {
  CAMPAIGN_BACK_TO_SCHOOL,
  PROMO_BTS_FLAT200,
} from '../fixtures/campaigns';
import { STATIONERY, APPAREL, BACK_TO_SCHOOL_PRODUCTS } from '../fixtures/products';

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 1 — Main BTS hero
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_HERO_BANNER_1: SDUINode<BannerHeroData> = {
  id: 'bts-hero-01',
  type: 'BANNER_HERO',
  analyticsLabel: 'bts_hero_main',
  testID: 'banner-hero-bts-main',
  data: {
    layout: 'overlay_bottom_left',
    height: 340,
    extendBehindStatusBar: true,
    media: {
      kind: 'image',
      image: {
        uri: 'https://images.kiddo.mock/banners/bts-hero-main-2025.webp',
        alt: 'Back to School 2025 — Gear Up for Greatness',
        placeholder: 'LKO}wvof_3j[fQj[RjWBM{t7WBof',
        resizeMode: 'cover',
        width: 1080,
        height: 680,
        srcSet: {
          '2x': 'https://images.kiddo.mock/banners/bts-hero-main-2025@2x.webp',
          '3x': 'https://images.kiddo.mock/banners/bts-hero-main-2025@3x.webp',
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
          { color: 'rgba(0,0,0,0.72)', position: 1 },
        ],
      },
    },
    content: {
      eyebrowText: 'BACK TO SCHOOL 2025',
      eyebrowStyle: { color: '#FFD54F', weight: 'bold', size: 11, transform: 'uppercase', letterSpacing: 1.5 } as never,
      headline: 'Gear Up for\nGreatness 🎒',
      headlineStyle: { color: '#FFFFFF', weight: 'extraBold', size: 28, numberOfLines: 2 },
      subheadline: 'Backpacks, stationery & more — up to 40% off',
      subheadlineStyle: { color: 'rgba(255,255,255,0.85)', weight: 'regular', size: 14 },
    },
    primaryCTA: {
      label: 'Shop Now',
      action: {
        type: 'DEEP_LINK',
        payload: {
          uri: 'kiddo://campaign/back-to-school',
          fallbackRoute: '/(tabs)/search',
          params: { campaignId: 'back-to-school', category: 'stationery' },
        },
      },
      theme: { variant: 'primary', size: 'md', background: '#1565C0', textColor: '#FFFFFF', borderRadius: 8 },
      accessibilityLabel: 'Shop Back to School deals',
    },
    secondaryCTA: {
      label: 'View All',
      action: {
        type: 'DEEP_LINK',
        payload: { uri: 'kiddo://category/school-supplies', fallbackRoute: '/(tabs)/search' },
      },
      theme: { variant: 'ghost', size: 'md', textColor: '#FFFFFF', borderRadius: 8 },
    },
    promotion: PROMO_BTS_FLAT200,
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    theme: {
      background: { kind: 'solid', color: '#0D47A1' },
      borderRadius: 0,
      elevation: 0,
    },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'back-to-school', position: 0, bannerType: 'hero_main' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Hero Banner 2 — School Essentials strip
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_HERO_BANNER_2: SDUINode<BannerHeroData> = {
  id: 'bts-hero-02',
  type: 'BANNER_HERO',
  analyticsLabel: 'bts_hero_essentials',
  testID: 'banner-hero-bts-essentials',
  data: {
    layout: 'split_right',
    height: 200,
    media: {
      kind: 'image',
      image: {
        uri: 'https://images.kiddo.mock/banners/bts-essentials-strip.webp',
        alt: 'School Essentials Kit',
        placeholder: 'LAS?DV9F~qt7ayj[M{WBIURjWBt7',
        resizeMode: 'cover',
        width: 540,
        height: 400,
      },
    },
    content: {
      eyebrowText: 'ESSENTIALS KIT',
      headline: 'Everything\nyour child needs',
      headlineStyle: { color: '#0D47A1', weight: 'extraBold', size: 20 },
      subheadline: 'Complete stationery sets from ₹199',
      subheadlineStyle: { color: '#424242', size: 13 },
    },
    primaryCTA: {
      label: 'Build My Kit',
      action: {
        type: 'DEEP_LINK',
        payload: {
          uri: 'kiddo://collection/school-essentials-kit',
          fallbackRoute: '/(tabs)/search',
          params: { campaignId: 'back-to-school' },
        },
      },
      theme: { variant: 'primary', size: 'sm', background: '#1565C0', textColor: '#FFFFFF', borderRadius: 6 },
    },
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    theme: {
      background: { kind: 'solid', color: '#E3F2FD' },
      borderRadius: 12,
      elevation: 2,
      padding: { top: 16, right: 12, bottom: 16, left: 16 },
    },
    analytics: {
      impressionEvent: 'banner_hero_viewed',
      tapEvent: 'banner_hero_tapped',
      properties: { campaignId: 'back-to-school', position: 1, bannerType: 'essentials_strip' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Product Grid — BTS essentials
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_PRODUCT_GRID: SDUINode<ProductGrid2x2Data> = {
  id: 'bts-grid-01',
  type: 'PRODUCT_GRID_2X2',
  analyticsLabel: 'bts_product_grid',
  data: {
    header: {
      title: 'School Essentials',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      subtitle: 'Everything packed, nothing missed',
      subtitleStyle: { color: '#757575', size: 13 },
      seeAllLabel: 'See All',
      seeAllAction: {
        type: 'DEEP_LINK',
        payload: { uri: 'kiddo://category/stationery', fallbackRoute: '/(tabs)/search' },
      },
    },
    items: [...BACK_TO_SCHOOL_PRODUCTS, ...STATIONERY.slice(0, 6)],
    gutter: 10,
    cardTheme: {
      background: '#FFFFFF',
      borderRadius: 10,
      elevation: 1,
      imageAspectRatio: 1,
      contentPadding: { top: 8, right: 8, bottom: 10, left: 8 },
      bordered: true,
      borderColor: '#F5F5F5',
    },
    pagination: {
      mode: 'load_more',
      totalCount: STATIONERY.length,
      pageSize: 8,
      loadMoreLabel: 'Load More Essentials',
      loadMoreButtonTheme: { variant: 'secondary', size: 'md', borderRadius: 8 },
    },
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    theme: {
      background: { kind: 'solid', color: '#FAFAFA' },
      padding: { top: 16, right: 12, bottom: 16, left: 12 },
    },
    analytics: {
      impressionEvent: 'product_grid_viewed',
      tapEvent: 'product_grid_item_tapped',
      properties: { campaignId: 'back-to-school', gridId: 'bts-grid-01' },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Category chips
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_CATEGORY_CHIPS: SDUINode<DynamicCollectionData> = {
  id: 'bts-cats-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'bts_category_chips',
  data: {
    collectionKind: 'category',
    header: {
      title: 'Shop by Category',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 80,
      itemHeight: 96,
      gutter: 12,
      leadingPadding: 16,
      snapToItem: false,
    },
    items: [
      { kind: 'category', id: 'cat-bags',   label: 'Bags',       backgroundColor: '#BBDEFB', image: { uri: 'https://images.kiddo.mock/categories/bags.webp', alt: 'School Bags' },   action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/bags' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'bags' } } },
      { kind: 'category', id: 'cat-station', label: 'Stationery', backgroundColor: '#C8E6C9', image: { uri: 'https://images.kiddo.mock/categories/stationery.webp', alt: 'Stationery' }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/stationery' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'stationery' } } },
      { kind: 'category', id: 'cat-books',  label: 'Books',      backgroundColor: '#FFF9C4', image: { uri: 'https://images.kiddo.mock/categories/books.webp', alt: 'Books' },       action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/books' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'books' } } },
      { kind: 'category', id: 'cat-shoes',  label: 'Shoes',      backgroundColor: '#FFCCBC', image: { uri: 'https://images.kiddo.mock/categories/shoes.webp', alt: 'Shoes' },       action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/shoes' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'shoes' } } },
      { kind: 'category', id: 'cat-art',    label: 'Art',        backgroundColor: '#F8BBD9', image: { uri: 'https://images.kiddo.mock/categories/art.webp', alt: 'Art Supplies' }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/art-supplies' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'art' } } },
      { kind: 'category', id: 'cat-sport',  label: 'Sports',     backgroundColor: '#D1C4E9', image: { uri: 'https://images.kiddo.mock/categories/sports.webp', alt: 'Sports' },   action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/sports' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'sports' } } },
      { kind: 'category', id: 'cat-tiffin', label: 'Tiffin',     backgroundColor: '#B2EBF2', image: { uri: 'https://images.kiddo.mock/categories/tiffin.webp', alt: 'Tiffin' },   action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/tiffin' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'tiffin' } } },
      { kind: 'category', id: 'cat-tech',   label: 'Tech',       backgroundColor: '#CFD8DC', image: { uri: 'https://images.kiddo.mock/categories/tech.webp', alt: 'Tech' },       action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://category/tech' } }, analytics: { tapEvent: 'category_chip_tapped', properties: { categoryId: 'tech' } } },
    ],
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    analytics: { impressionEvent: 'category_row_viewed', properties: { campaignId: 'back-to-school' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Dynamic Collection — Brand logos
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_BRAND_ROW: SDUINode<DynamicCollectionData> = {
  id: 'bts-brands-01',
  type: 'DYNAMIC_COLLECTION',
  analyticsLabel: 'bts_brand_row',
  data: {
    collectionKind: 'brand',
    header: {
      title: 'Top School Brands',
      titleStyle: { color: '#212121', weight: 'bold', size: 18 },
      seeAllLabel: 'All Brands',
      seeAllAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brands', fallbackRoute: '/(tabs)/search' } },
    },
    layout: {
      scrollDirection: 'horizontal',
      itemWidth: 90,
      itemHeight: 80,
      gutter: 12,
      leadingPadding: 16,
    },
    items: [
      { kind: 'brand', id: 'br-apsara',    name: 'Apsara',      logoImage: { uri: 'https://images.kiddo.mock/brands/apsara.webp', alt: 'Apsara' },      action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/apsara' } } },
      { kind: 'brand', id: 'br-classmate', name: 'Classmate',   logoImage: { uri: 'https://images.kiddo.mock/brands/classmate.webp', alt: 'Classmate' }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/classmate' } } },
      { kind: 'brand', id: 'br-lego',      name: 'LEGO',        logoImage: { uri: 'https://images.kiddo.mock/brands/lego.webp', alt: 'LEGO' },           action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/lego' } } },
      { kind: 'brand', id: 'br-crayola',   name: 'Crayola',     logoImage: { uri: 'https://images.kiddo.mock/brands/crayola.webp', alt: 'Crayola' },     action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/crayola' } } },
      { kind: 'brand', id: 'br-skybags',   name: 'Skybags',     logoImage: { uri: 'https://images.kiddo.mock/brands/skybags.webp', alt: 'Skybags' },     action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/skybags' } } },
      { kind: 'brand', id: 'br-faber',     name: 'Faber-Castell', logoImage: { uri: 'https://images.kiddo.mock/brands/faber-castell.webp', alt: 'Faber-Castell' }, action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/faber-castell' } } },
      { kind: 'brand', id: 'br-casio',     name: 'Casio',       logoImage: { uri: 'https://images.kiddo.mock/brands/casio.webp', alt: 'Casio' },         action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://brand/casio' } } },
    ],
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    analytics: { impressionEvent: 'brand_row_viewed', properties: { campaignId: 'back-to-school' } },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Full-Screen Overlay — BTS promotional interstitial
// ─────────────────────────────────────────────────────────────────────────────
export const BTS_OVERLAY: SDUINode<FullScreenOverlayData> = {
  id: 'bts-overlay-01',
  type: 'FULL_SCREEN_OVERLAY',
  analyticsLabel: 'bts_promo_overlay',
  data: {
    content: {
      kind: 'promotional',
      headerMedia: {
        kind: 'image',
        image: {
          uri: 'https://images.kiddo.mock/overlays/bts-promo-header.webp',
          alt: 'Back to School Offer',
          width: 600,
          height: 280,
        },
        height: 280,
      },
      headline: '🎒 ₹200 OFF\nYour First BTS Order',
      headlineStyle: { color: '#0D47A1', weight: 'extraBold', size: 26, align: 'center' },
      body: 'Use code SCHOOL200 on orders above ₹999.\nValid on all school essentials.',
      bodyStyle: { color: '#424242', size: 14, align: 'center', numberOfLines: 3 },
      promotion: PROMO_BTS_FLAT200,
      primaryCTA: {
        label: 'Shop Now & Save ₹200',
        action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://campaign/back-to-school', params: { coupon: 'SCHOOL200' } } },
        theme: { variant: 'primary', size: 'full', background: '#1565C0', textColor: '#FFFFFF', borderRadius: 10 },
      },
      secondaryCTA: {
        label: 'Maybe Later',
        action: { type: 'DEEP_LINK', payload: { uri: 'kiddo://dismiss' } },
        theme: { variant: 'ghost', size: 'md', textColor: '#9E9E9E' },
      },
      footerText: '* T&C apply. One use per customer.',
      footerTextStyle: { color: '#9E9E9E', size: 11, align: 'center' },
    },
    trigger: { on: 'delay', delayMs: 2500 },
    dismissConfig: {
      mode: 'both',
      closeButtonPosition: 'top_right',
      onDismissAction: { type: 'DEEP_LINK', payload: { uri: 'kiddo://track/overlay_dismissed', params: { overlayId: 'bts-overlay-01' } } },
    },
    overlayTheme: {
      scrimColor: 'rgba(0,0,0,0.6)',
      scrimOpacity: 0.6,
      contentBackground: { kind: 'solid', color: '#FFFFFF' },
      borderRadius: 20,
      enterAnimation: 'slide_up',
      exitAnimation: 'slide_down',
      animationDuration: 350,
    },
    campaign: CAMPAIGN_BACK_TO_SCHOOL,
    showOncePerSession: true,
    analytics: {
      impressionEvent: 'overlay_viewed',
      tapEvent: 'overlay_cta_tapped',
      properties: { campaignId: 'back-to-school', overlayId: 'bts-overlay-01' },
    },
  },
};

export const BACK_TO_SCHOOL_NODES: SDUINode[] = [
  BTS_HERO_BANNER_1 as unknown as SDUINode,
  BTS_CATEGORY_CHIPS as unknown as SDUINode,
  BTS_HERO_BANNER_2 as unknown as SDUINode,
  BTS_BRAND_ROW as unknown as SDUINode,
  BTS_PRODUCT_GRID as unknown as SDUINode,
  BTS_OVERLAY as unknown as SDUINode,
];
