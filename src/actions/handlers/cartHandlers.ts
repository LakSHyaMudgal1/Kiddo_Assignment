import { useStore } from '@store/rootStore';
import type {
  AddToCartPayload,
  RemoveFromCartPayload,
  UpdateCartQuantityPayload,
  ApplyCouponPayload,
} from '../types';

export const handleAddToCart = (payload: AddToCartPayload): void => {
  useStore.getState().addItem({
    productId: payload.productId,
    variantId: payload.variantId,
    sku: payload.sku,
    name: payload.name,
    imageUrl: payload.imageUrl,
    price: payload.price,
    originalPrice: payload.originalPrice ?? null,
    quantity: payload.quantity ?? 1,
    maxQuantity: payload.maxQuantity ?? 99,
  });

  useStore.getState().showToast({
    message: `${payload.name} added to cart`,
    variant: 'success',
  });
};

export const handleRemoveFromCart = (payload: RemoveFromCartPayload): void => {
  useStore.getState().removeItem(payload.productId, payload.variantId);
};

export const handleUpdateCartQuantity = (
  payload: UpdateCartQuantityPayload,
): void => {
  useStore
    .getState()
    .updateQuantity(payload.productId, payload.variantId, payload.quantity);
};

export const handleClearCart = (): void => {
  useStore.getState().clearCart();
};

export const handleApplyCoupon = (payload: ApplyCouponPayload): void => {
  useStore.getState().applyCoupon(payload.code, payload.discount);
  useStore.getState().showToast({
    message: `Coupon "${payload.code}" applied`,
    variant: 'success',
  });
};
