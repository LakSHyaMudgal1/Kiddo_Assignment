/**
 * registerComponents.ts
 *
 * The ONLY file that couples component type keys to concrete React components.
 *
 * ─── Extensibility rule ──────────────────────────────────────────────────────
 * Adding a new component requires exactly two steps:
 *   1. Create the component file + data interface
 *   2. Add one entry to COMPONENT_REGISTRY below
 *
 * Nothing else changes — no renderer code, no switch cases, no type assertions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  createRegistry,
  type SDUIComponentRegistry,
} from './componentRegistry';

import {
  validateBannerHero,
  validateProductGrid2x2,
  validateDynamicCollection,
  validateFullScreenOverlay,
} from './validators';

import { BannerHero }          from '@components/sdui/BannerHero';
import { ProductGrid2x2 }      from '@components/sdui/ProductGrid2x2';
import { DynamicCollection }   from '@components/sdui/DynamicCollection';
import { FullScreenOverlay }   from '@components/sdui/FullScreenOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// Base registry
//
// This is the factory object the assignment requires:
//
//   const registry = {
//     BANNER_HERO:          BannerHero,
//     PRODUCT_GRID_2X2:     ProductGrid2x2,
//     DYNAMIC_COLLECTION:   DynamicCollection,
//     FULL_SCREEN_OVERLAY:  FullScreenOverlay,
//   };
//
// Each entry also carries its validator so the renderer can gate on schema.
// ─────────────────────────────────────────────────────────────────────────────

const BASE_REGISTRY: SDUIComponentRegistry = {
  BANNER_HERO: {
    component: BannerHero,
    validate:  validateBannerHero,
  },
  PRODUCT_GRID_2X2: {
    component: ProductGrid2x2,
    validate:  validateProductGrid2x2,
  },
  DYNAMIC_COLLECTION: {
    component: DynamicCollection,
    validate:  validateDynamicCollection,
  },
  FULL_SCREEN_OVERLAY: {
    component: FullScreenOverlay,
    validate:  validateFullScreenOverlay,
  },
  // ── Uncomment as real components are built ─────────────────────────────
  // PRODUCT_CARD:    { component: ProductCard,   validate: validateProductCard },
  // CAROUSEL:        { component: Carousel,       validate: validateCarousel },
  // BANNER:          { component: Banner,         validate: validateBanner },
  // CATEGORY_GRID:   { component: CategoryGrid,   validate: validateCategoryGrid },
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// Active registry — frozen, supports A/B overrides via second argument
// ─────────────────────────────────────────────────────────────────────────────

/**
 * REGISTRY is the single frozen object the renderer imports.
 *
 * To swap a component for an A/B variant at runtime, call:
 *   getActiveRegistry({ BANNER_HERO: { component: BannerHeroVariantB } })
 */
export const REGISTRY = createRegistry(BASE_REGISTRY);

export function getActiveRegistry(
  overrides: SDUIComponentRegistry = {},
): ReturnType<typeof createRegistry> {
  return createRegistry(BASE_REGISTRY, overrides);
}

// Legacy compat — called from app/_layout.tsx boot sequence
export function registerAllComponents(): void {
  if (__DEV__) {
    const keys = Object.keys(REGISTRY);
    console.log(`[Registry] ${keys.length} components registered:`, keys);
  }
}
