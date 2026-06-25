/**
 * components/index.ts
 *
 * Master discriminated union for all typed SDUI component nodes.
 *
 * EXTENDING THE SYSTEM
 * ────────────────────
 * 1. Create src/types/components/MyNewComponent.ts
 *    → Define `MyNewComponentData` and `MyNewComponentNode`
 * 2. Add the component key to `ComponentTypeKey` in registry/types.ts
 * 3. Add `MyNewComponentNode` to `TypedSDUINode` below
 * 4. Register the React component in registry/registerComponents.ts
 *
 * That's it. No existing component interfaces change.
 */

export type { BannerHeroData, BannerHeroNode, BannerHeroLayout, BannerHeroMedia, BannerHeroCTA, BannerHeroTextContent } from './BannerHero';
export type { ProductGrid2x2Data, ProductGrid2x2Node, ProductGridItem, ProductGridPrice, ProductGridBadge, ProductGridSectionHeader, ProductGridPagination } from './ProductGrid2x2';
export type { DynamicCollectionData, DynamicCollectionNode, DynamicCollectionItem, CollectionProductItem, CollectionCategoryItem, CollectionBrandItem, CollectionBannerItem, CollectionMysteryGiftItem, CollectionItemOfKind, CollectionLayoutConfig, CollectionSectionHeader } from './DynamicCollection';
export type { FullScreenOverlayData, FullScreenOverlayNode, OverlayContent, OverlayContentKind, OverlayContentOfKind, OverlayPromotionalContent, OverlayMysteryGiftContent, OverlayFlashSaleContent, OverlayOnboardingContent, OverlayAppUpdateContent, OverlayCTA, OverlayDismissConfig, OverlayHeaderMedia, OverlayTrigger } from './FullScreenOverlay';

import type { BannerHeroNode } from './BannerHero';
import type { ProductGrid2x2Node } from './ProductGrid2x2';
import type { DynamicCollectionNode } from './DynamicCollection';
import type { FullScreenOverlayNode } from './FullScreenOverlay';

/**
 * TypedSDUINode — the master discriminated union.
 *
 * Narrow with: `if (node.type === 'BANNER_HERO') { ... }`
 * TypeScript will infer `node.data` as `BannerHeroData` inside the branch.
 *
 * For components without a dedicated data interface yet, the union falls
 * through to the base `SDUINode<Record<string, unknown>>` via the `else`
 * branch — guaranteeing the rest of the app still compiles.
 */
export type TypedSDUINode =
  | BannerHeroNode
  | ProductGrid2x2Node
  | DynamicCollectionNode
  | FullScreenOverlayNode;

/**
 * Map from component type key → its data interface.
 * Enables generic lookup: `SDUIDataMap['BANNER_HERO']` → `BannerHeroData`.
 */
export interface SDUIDataMap {
  BANNER_HERO: import('./BannerHero').BannerHeroData;
  PRODUCT_GRID_2X2: import('./ProductGrid2x2').ProductGrid2x2Data;
  DYNAMIC_COLLECTION: import('./DynamicCollection').DynamicCollectionData;
  FULL_SCREEN_OVERLAY: import('./FullScreenOverlay').FullScreenOverlayData;
}

/** Typed component keys for the four concrete components */
export type TypedComponentKey = keyof SDUIDataMap;

/**
 * Generic helper: given a component key K, resolves its data type.
 *
 * @example
 *   type HeroData = SDUIDataFor<'BANNER_HERO'>; // → BannerHeroData
 */
export type SDUIDataFor<K extends TypedComponentKey> = SDUIDataMap[K];
