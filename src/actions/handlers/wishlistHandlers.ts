import { useStore } from '@store/rootStore';
import type { WishlistPayload } from '../types';

export const handleAddToWishlist = (payload: WishlistPayload): void => {
  useStore.getState().addToWishlist(payload.productId, payload.variantId);
  useStore.getState().showToast({
    message: 'Added to wishlist',
    variant: 'info',
  });
};

export const handleRemoveFromWishlist = (payload: WishlistPayload): void => {
  useStore.getState().removeFromWishlist(payload.productId, payload.variantId);
};
