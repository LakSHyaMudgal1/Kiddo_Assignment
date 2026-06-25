import type { RootStore } from '../rootStore';

/**
 * Memoized cart selectors — use with useStore(selector) to avoid
 * unnecessary re-renders by subscribing only to relevant slices.
 */
export const selectCartItems = (state: RootStore) => state.items;

export const selectCartItemCount = (state: RootStore) =>
  state.items.reduce((sum, item) => sum + item.quantity, 0);

export const selectCartSubtotal = (state: RootStore) =>
  state.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

export const selectCartTotal = (state: RootStore) => {
  const subtotal = selectCartSubtotal(state);
  return Math.max(0, subtotal - state.discountAmount);
};

export const selectCartSavings = (state: RootStore) =>
  state.items.reduce(
    (sum, item) =>
      sum +
      ((item.originalPrice ?? item.price) - item.price) * item.quantity,
    0,
  );

export const selectIsInCart =
  (productId: string, variantId: string) => (state: RootStore) =>
    state.items.some(
      (i) => i.productId === productId && i.variantId === variantId,
    );
