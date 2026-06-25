/**
 * PRODUCT_GRID_2X2 component data interface.
 *
 * A 2-column product grid driven entirely by the server.
 * The server owns the product list, badges, and per-card actions.
 * FlashList is used for rendering — the data interface is shaped
 * to make that integration as frictionless as possible.
 *
 *  ┌─────────────┐  ┌─────────────┐
 *  │  Product A  │  │  Product B  │
 *  │  [image]    │  │  [image]    │
 *  │  name       │  │  name       │
 *  │  price  ❤   │  │  price  ❤   │
 *  │  [Add Cart] │  │  [Add Cart] │
 *  └─────────────┘  └─────────────┘
 *  ┌─────────────┐  ┌─────────────┐
 *  │  Product C  │  │  Product D  │
 *  │   ...       │  │   ...       │
 *  └─────────────┘  └─────────────┘
 *         [Load More / See All]
 */

import type {
  SDUIImage,
  SDUITextStyle,
  SDUIComponentAction,
  SDUIAnalytics,
  SDUIVisibility,
} from '../sdui-primitives';
import type { SDUIThemeOverride, SDUIButtonTheme, SDUICardTheme, SDUIBadgeTheme } from '../sdui-theme';
import type { Campaign, Promotion } from '../sdui-campaign';
import type { SDUINode } from '@registry/types';

// ─────────────────────────────────────────────────────────────────────────────
// Per-card item
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Badge displayed over the product image — e.g. "NEW", "SALE", "HOT".
 */
export interface ProductGridBadge {
  label: string;
  theme: SDUIBadgeTheme;
  /** Placement on the card image */
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right';
}

/**
 * Price display block for a grid card.
 */
export interface ProductGridPrice {
  /** Selling price (already discounted) */
  salePrice: number;
  /** Original price before discount — shown as strikethrough when present */
  originalPrice?: number;
  /** Formatted discount label, e.g. "40% off". Server owns the formatting. */
  discountLabel?: string;
  /** Currency symbol/code, e.g. "₹" or "USD" */
  currency: string;
  /** Colour override for the sale price */
  salePriceStyle?: SDUITextStyle;
  originalPriceStyle?: SDUITextStyle;
  discountLabelStyle?: SDUITextStyle;
}

/**
 * Represents one product card in the 2×2 grid.
 */
export interface ProductGridItem {
  /** Stable key used by FlashList for reconciliation */
  id: string;

  /** Product & variant references — forwarded to ADD_TO_CART payload */
  productId: string;
  variantId: string;
  sku: string;

  name: string;
  nameStyle?: SDUITextStyle;

  brandName?: string;
  brandNameStyle?: SDUITextStyle;

  image: SDUIImage;

  price: ProductGridPrice;

  /** Star rating 0–5 */
  rating?: number;
  /** Review count */
  reviewCount?: number;

  badge?: ProductGridBadge;

  /** Explicit promotion attached to this card */
  promotion?: Promotion;

  /**
   * Primary CTA action.
   * Defaults to ADD_TO_CART if omitted — the renderer fills the payload
   * from productId / variantId / sku / price.
   */
  primaryAction?: SDUIComponentAction;

  /**
   * Whether the wishlist heart icon is shown on this card.
   * Actual wishlist state is read from the Zustand store.
   */
  showWishlist?: boolean;

  /** Out-of-stock cards are rendered with a greyed-out state */
  isOutOfStock?: boolean;

  analytics?: SDUIAnalytics;
}

// ─────────────────────────────────────────────────────────────────────────────
// Section header
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductGridSectionHeader {
  title: string;
  titleStyle?: SDUITextStyle;
  subtitle?: string;
  subtitleStyle?: SDUITextStyle;
  /** "See All" link */
  seeAllAction?: SDUIComponentAction;
  seeAllLabel?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pagination / load-more
// ─────────────────────────────────────────────────────────────────────────────

export type ProductGridPaginationMode =
  | 'none'            // all items loaded at once
  | 'load_more'       // "Load More" button at the bottom
  | 'see_all';        // single "See All" CTA that navigates away

export interface ProductGridPagination {
  mode: ProductGridPaginationMode;
  /** Total items available on the server — shows "X of Y" when present */
  totalCount?: number;
  /** Page size for load_more mode */
  pageSize?: number;
  /** Deep-link / navigate action for see_all mode */
  seeAllAction?: SDUIComponentAction;
  /** Label for the load_more button */
  loadMoreLabel?: string;
  loadMoreButtonTheme?: SDUIButtonTheme;
}

// ─────────────────────────────────────────────────────────────────────────────
// Root data interface
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductGrid2x2Data {
  /** Header shown above the grid */
  header?: ProductGridSectionHeader;

  items: ProductGridItem[];

  pagination?: ProductGridPagination;

  /**
   * Spacing between cards in dp.
   * Defaults to 8 if omitted.
   */
  gutter?: number;

  /** Per-card theme applied to all cards uniformly */
  cardTheme?: SDUICardTheme;

  /** Per-component theme override for the container */
  theme?: SDUIThemeOverride;

  /** Campaign metadata — shared across all cards in this grid */
  campaign?: Campaign;

  analytics?: SDUIAnalytics;

  visibility?: SDUIVisibility;
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed SDUINode specialisation
// ─────────────────────────────────────────────────────────────────────────────

export type ProductGrid2x2Node = SDUINode<ProductGrid2x2Data> & {
  type: 'PRODUCT_GRID_2X2';
};
