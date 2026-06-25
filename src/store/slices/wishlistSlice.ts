import type { StateCreator } from 'zustand';

export interface WishlistItem {
  productId: string;
  variantId: string | null;
  addedAt: number; // Unix timestamp
}

export interface WishlistSlice {
  wishlistItems: WishlistItem[];

  addToWishlist: (productId: string, variantId?: string) => void;
  removeFromWishlist: (productId: string, variantId?: string) => void;
  isInWishlist: (productId: string, variantId?: string) => boolean;
  clearWishlist: () => void;
}

export const createWishlistSlice: StateCreator<
  WishlistSlice,
  [],
  [],
  WishlistSlice
> = (set, get) => ({
  wishlistItems: [],

  addToWishlist: (productId, variantId) => {
    const alreadyAdded = get().isInWishlist(productId, variantId);
    if (!alreadyAdded) {
      set((state) => ({
        wishlistItems: [
          ...state.wishlistItems,
          { productId, variantId: variantId ?? null, addedAt: Date.now() },
        ],
      }));
    }
  },

  removeFromWishlist: (productId, variantId) =>
    set((state) => ({
      wishlistItems: state.wishlistItems.filter(
        (i) =>
          !(
            i.productId === productId &&
            (variantId === undefined || i.variantId === variantId)
          ),
      ),
    })),

  isInWishlist: (productId, variantId) =>
    get().wishlistItems.some(
      (i) =>
        i.productId === productId &&
        (variantId === undefined || i.variantId === variantId),
    ),

  clearWishlist: () => set({ wishlistItems: [] }),
});
