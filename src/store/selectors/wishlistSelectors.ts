import type { RootStore } from '../rootStore';

/**
 * Selector: is a specific product+variant in the wishlist?
 *
 * Returns a per-item selector factory — the same pattern as selectIsInCart.
 * Each ProductCard subscribes with its own (productId, variantId) pair,
 * so only that card re-renders when its own wishlist state changes.
 */
export const selectIsInWishlist =
  (productId: string, variantId?: string) =>
  (state: RootStore): boolean =>
    state.wishlistItems.some(
      (i) =>
        i.productId === productId &&
        (variantId === undefined || i.variantId === variantId),
    );

export const selectWishlistCount = (state: RootStore): number =>
  state.wishlistItems.length;
