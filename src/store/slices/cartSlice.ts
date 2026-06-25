import type { StateCreator } from 'zustand';

export interface CartItem {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice: number | null;
  quantity: number;
  maxQuantity: number;
}

export interface CartSlice {
  // State
  items: CartItem[];
  couponCode: string | null;
  discountAmount: number;
  isCartLoading: boolean;

  // Derived (computed in selectors, not stored)

  // Actions
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantId: string) => void;
  updateQuantity: (productId: string, variantId: string, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  setCartLoading: (loading: boolean) => void;
}

export const createCartSlice: StateCreator<CartSlice, [], [], CartSlice> = (
  set,
  get,
) => ({
  items: [],
  couponCode: null,
  discountAmount: 0,
  isCartLoading: false,

  addItem: (newItem) => {
    const existing = get().items.find(
      (i) => i.productId === newItem.productId && i.variantId === newItem.variantId,
    );
    if (existing) {
      set((state) => ({
        items: state.items.map((i) =>
          i.productId === newItem.productId && i.variantId === newItem.variantId
            ? { ...i, quantity: Math.min(i.quantity + newItem.quantity, i.maxQuantity) }
            : i,
        ),
      }));
    } else {
      set((state) => ({ items: [...state.items, newItem] }));
    }
  },

  removeItem: (productId, variantId) =>
    set((state) => ({
      items: state.items.filter(
        (i) => !(i.productId === productId && i.variantId === variantId),
      ),
    })),

  updateQuantity: (productId, variantId, quantity) => {
    if (quantity <= 0) {
      get().removeItem(productId, variantId);
      return;
    }
    set((state) => ({
      items: state.items.map((i) =>
        i.productId === productId && i.variantId === variantId
          ? { ...i, quantity: Math.min(quantity, i.maxQuantity) }
          : i,
      ),
    }));
  },

  clearCart: () => set({ items: [], couponCode: null, discountAmount: 0 }),

  applyCoupon: (couponCode, discountAmount) =>
    set({ couponCode, discountAmount }),

  removeCoupon: () => set({ couponCode: null, discountAmount: 0 }),

  setCartLoading: (isCartLoading) => set({ isCartLoading }),
});
