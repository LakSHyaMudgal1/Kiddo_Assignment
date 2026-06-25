/**
 * DYNAMIC_COLLECTION component data interface.
 *
 * A horizontally or vertically scrollable collection whose item shape
 * is determined at runtime by a `collectionKind` discriminant.
 * This lets one component type serve many use-cases:
 *   - "Top Deals" row of product cards
 *   - "Shop by Category" chip row
 *   - "Trending Brands" logo carousel
 *   - "Recently Viewed" horizontal product list
 *
 * Because the item shape varies, a discriminated union
 * (DynamicCollectionItem) ensures correct narrowing in the renderer.
 *
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ [Header]                                     [See All →]     │
 *  │                                                              │
 *  │  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐                   │
 *  │  │ A  │  │ B  │  │ C  │  │ D  │  │ E  │  ──────────────>  │
 *  │  └────┘  └────┘  └────┘  └────┘  └────┘                   │
 *  └──────────────────────────────────────────────────────────────┘
 */

import type {
  SDUIImage,
  SDUITextStyle,
  SDUIComponentAction,
  SDUIAnalytics,
  SDUIVisibility,
  SDUIColor,
} from '../sdui-primitives';
import type { SDUIThemeOverride, SDUICardTheme, SDUIBadgeTheme } from '../sdui-theme';
import type { Campaign, Promotion } from '../sdui-campaign';
import type { SDUINode } from '@registry/types';
import type { ProductGridPrice, ProductGridBadge } from './ProductGrid2x2';

// ─────────────────────────────────────────────────────────────────────────────
// Collection scroll direction
// ─────────────────────────────────────────────────────────────────────────────

export type CollectionScrollDirection = 'horizontal' | 'vertical';

// ─────────────────────────────────────────────────────────────────────────────
// Item discriminated union
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Product item — mini horizontal or vertical product card.
 */
export interface CollectionProductItem {
  kind: 'product';
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  nameStyle?: SDUITextStyle;
  image: SDUIImage;
  price: ProductGridPrice;
  badge?: ProductGridBadge;
  promotion?: Promotion;
  rating?: number;
  isOutOfStock?: boolean;
  primaryAction?: SDUIComponentAction;
  showWishlist?: boolean;
  analytics?: SDUIAnalytics;
}

/**
 * Category chip — circular/square image + label.
 */
export interface CollectionCategoryItem {
  kind: 'category';
  id: string;
  label: string;
  labelStyle?: SDUITextStyle;
  image?: SDUIImage;
  /** Solid color used as background when no image is provided */
  backgroundColor?: SDUIColor;
  action: SDUIComponentAction;
  analytics?: SDUIAnalytics;
}

/**
 * Brand logo tile.
 */
export interface CollectionBrandItem {
  kind: 'brand';
  id: string;
  name: string;
  logoImage: SDUIImage;
  action: SDUIComponentAction;
  /** Optional tagline below the logo */
  tagline?: string;
  analytics?: SDUIAnalytics;
}

/**
 * Generic banner card — a mini-banner inside the collection row.
 */
export interface CollectionBannerItem {
  kind: 'banner';
  id: string;
  image: SDUIImage;
  title?: string;
  titleStyle?: SDUITextStyle;
  subtitle?: string;
  badge?: { label: string; theme: SDUIBadgeTheme };
  action: SDUIComponentAction;
  analytics?: SDUIAnalytics;
}

/**
 * Mystery gift teaser card — reveals itself on tap.
 */
export interface CollectionMysteryGiftItem {
  kind: 'mystery_gift';
  id: string;
  /** Text shown on the unrevealed card */
  teaserLabel: string;
  teaserImage?: SDUIImage;
  /** Lottie played during reveal animation */
  revealLottieSource?: string;
  action: SDUIComponentAction; // always APPLY_MYSTERY_GIFT_COUPON
  analytics?: SDUIAnalytics;
}

/**
 * The discriminated union of all possible collection item shapes.
 * Adding a new kind here is all that is needed to extend the system —
 * the renderer switches on `item.kind`.
 */
export type DynamicCollectionItem =
  | CollectionProductItem
  | CollectionCategoryItem
  | CollectionBrandItem
  | CollectionBannerItem
  | CollectionMysteryGiftItem;

/** Helper: extract a specific item kind from the union */
export type CollectionItemOfKind<K extends DynamicCollectionItem['kind']> =
  Extract<DynamicCollectionItem, { kind: K }>;

// ─────────────────────────────────────────────────────────────────────────────
// Section header (same shape as ProductGrid — re-exported from here for DRY)
// ─────────────────────────────────────────────────────────────────────────────

export interface CollectionSectionHeader {
  title: string;
  titleStyle?: SDUITextStyle;
  subtitle?: string;
  subtitleStyle?: SDUITextStyle;
  seeAllAction?: SDUIComponentAction;
  seeAllLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout config
// ─────────────────────────────────────────────────────────────────────────────

export interface CollectionLayoutConfig {
  scrollDirection: CollectionScrollDirection;
  /** Number of rows for a multi-row horizontal scroll (default 1) */
  numRows?: number;
  /** Fixed width of each item in dp — if omitted, items size to content */
  itemWidth?: number;
  /** Fixed height of each item in dp */
  itemHeight?: number;
  /** Gap between items in dp (default 12) */
  gutter?: number;
  /** Padding at the leading edge of the list */
  leadingPadding?: number;
  /** Whether to snap to item boundaries on scroll */
  snapToItem?: boolean;
  /** Show scroll indicator dots (used for banner carousels) */
  showScrollIndicator?: boolean;
  /** Auto-advance interval in ms (0 = disabled) */
  autoAdvanceInterval?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root data interface
// ─────────────────────────────────────────────────────────────────────────────

export interface DynamicCollectionData {
  /** Discriminant that tells the renderer which item renderer to use */
  collectionKind: DynamicCollectionItem['kind'];

  header?: CollectionSectionHeader;

  items: DynamicCollectionItem[];

  layout: CollectionLayoutConfig;

  /**
   * Per-card theme — only applied to items that support it
   * (product, banner, mystery_gift).
   */
  cardTheme?: SDUICardTheme;

  /** Container theme override */
  theme?: SDUIThemeOverride;

  campaign?: Campaign;

  analytics?: SDUIAnalytics;

  visibility?: SDUIVisibility;

  /**
   * Empty-state configuration shown when items.length === 0.
   * The renderer falls back to a default skeleton if omitted.
   */
  emptyState?: {
    message: string;
    image?: SDUIImage;
    action?: SDUIComponentAction;
    actionLabel?: string;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed SDUINode specialisation
// ─────────────────────────────────────────────────────────────────────────────

export type DynamicCollectionNode = SDUINode<DynamicCollectionData> & {
  type: 'DYNAMIC_COLLECTION';
};
