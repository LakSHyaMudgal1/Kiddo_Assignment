/**
 * Action type constants.
 * All SDUI action.type values must be declared here.
 */
export const ActionTypes = {
  // Navigation
  NAVIGATE: 'NAVIGATE',
  NAVIGATE_BACK: 'NAVIGATE_BACK',
  OPEN_MODAL: 'OPEN_MODAL',
  CLOSE_MODAL: 'CLOSE_MODAL',
  OPEN_BOTTOM_SHEET: 'OPEN_BOTTOM_SHEET',
  CLOSE_BOTTOM_SHEET: 'CLOSE_BOTTOM_SHEET',
  OPEN_EXTERNAL_URL: 'OPEN_EXTERNAL_URL',

  // Cart
  ADD_TO_CART: 'ADD_TO_CART',
  REMOVE_FROM_CART: 'REMOVE_FROM_CART',
  UPDATE_CART_QUANTITY: 'UPDATE_CART_QUANTITY',
  CLEAR_CART: 'CLEAR_CART',
  APPLY_COUPON: 'APPLY_COUPON',

  // Wishlist
  ADD_TO_WISHLIST: 'ADD_TO_WISHLIST',
  REMOVE_FROM_WISHLIST: 'REMOVE_FROM_WISHLIST',

  // Auth
  LOGOUT: 'LOGOUT',
  OPEN_LOGIN: 'OPEN_LOGIN',

  // Analytics
  TRACK_EVENT: 'TRACK_EVENT',
  TRACK_IMPRESSION: 'TRACK_IMPRESSION',

  // UI
  SHOW_TOAST: 'SHOW_TOAST',
  COPY_TO_CLIPBOARD: 'COPY_TO_CLIPBOARD',
  SHARE: 'SHARE',
  RATE_APP: 'RATE_APP',

  // Campaign / Promotions
  DEEP_LINK: 'DEEP_LINK',
  APPLY_MYSTERY_GIFT_COUPON: 'APPLY_MYSTERY_GIFT_COUPON',
} as const;

export type ActionType = (typeof ActionTypes)[keyof typeof ActionTypes];

// ---------------------------------------------------------------------------
// Typed payload shapes for each action
// ---------------------------------------------------------------------------

export interface NavigatePayload {
  route: string;
  params?: Record<string, unknown> | undefined;
  replace?: boolean | undefined;
}

export interface OpenModalPayload {
  modalKey: string;
  props?: Record<string, unknown> | undefined;
}

export interface OpenBottomSheetPayload {
  componentKey: string;
  snapPoints?: string[] | undefined;
  props?: Record<string, unknown> | undefined;
}

export interface OpenExternalUrlPayload {
  url: string;
}

export interface AddToCartPayload {
  productId: string;
  variantId: string;
  sku: string;
  name: string;
  imageUrl: string;
  price: number;
  originalPrice?: number | undefined;
  quantity?: number | undefined;
  maxQuantity?: number | undefined;
}

export interface RemoveFromCartPayload {
  productId: string;
  variantId: string;
}

export interface UpdateCartQuantityPayload {
  productId: string;
  variantId: string;
  quantity: number;
}

export interface ApplyCouponPayload {
  code: string;
  discount: number;
}

export interface WishlistPayload {
  productId: string;
  variantId?: string | undefined;
}

export interface ShowToastPayload {
  message: string;
  variant: 'success' | 'error' | 'warning' | 'info';
  duration?: number | undefined;
}

export interface TrackEventPayload {
  eventName: string;
  properties?: Record<string, unknown> | undefined;
}

export interface SharePayload {
  title?: string | undefined;
  message: string;
  url?: string | undefined;
}

// ---------------------------------------------------------------------------
// Campaign / Promotion payloads
// ---------------------------------------------------------------------------

/**
 * DEEP_LINK — navigate to any in-app or external destination
 * by URI scheme rather than a typed route.
 */
export interface DeepLinkPayload {
  /** Full URI, e.g. "kiddo://product/123" or "https://kiddo.com/sale" */
  uri: string;
  /**
   * Fallback route used when the URI cannot be resolved
   * (e.g. old app version missing a screen).
   */
  fallbackRoute?: string | undefined;
  /** Optional query params merged on top of the URI */
  params?: Record<string, string> | undefined;
}

/**
 * APPLY_MYSTERY_GIFT_COUPON — server picks the coupon; client just triggers
 * the flow. The actual code is resolved server-side and returned in the
 * response, so the payload only carries campaign metadata.
 */
export interface ApplyMysteryGiftCouponPayload {
  campaignId: string;
  /**
   * Minimum cart value required before the mystery coupon can be applied.
   * If undefined the server enforces the rule instead.
   */
  minCartValue?: number | undefined;
  /** Toast / modal copy override from the server */
  successMessage?: string | undefined;
  failureMessage?: string | undefined;
}

/**
 * A concrete dispatched action — type + narrowed payload.
 */
export type AppAction =
  | { type: 'NAVIGATE'; payload: NavigatePayload }
  | { type: 'NAVIGATE_BACK'; payload?: undefined }
  | { type: 'OPEN_MODAL'; payload: OpenModalPayload }
  | { type: 'CLOSE_MODAL'; payload?: undefined }
  | { type: 'OPEN_BOTTOM_SHEET'; payload: OpenBottomSheetPayload }
  | { type: 'CLOSE_BOTTOM_SHEET'; payload?: undefined }
  | { type: 'OPEN_EXTERNAL_URL'; payload: OpenExternalUrlPayload }
  | { type: 'ADD_TO_CART'; payload: AddToCartPayload }
  | { type: 'REMOVE_FROM_CART'; payload: RemoveFromCartPayload }
  | { type: 'UPDATE_CART_QUANTITY'; payload: UpdateCartQuantityPayload }
  | { type: 'CLEAR_CART'; payload?: undefined }
  | { type: 'APPLY_COUPON'; payload: ApplyCouponPayload }
  | { type: 'ADD_TO_WISHLIST'; payload: WishlistPayload }
  | { type: 'REMOVE_FROM_WISHLIST'; payload: WishlistPayload }
  | { type: 'LOGOUT'; payload?: undefined }
  | { type: 'OPEN_LOGIN'; payload?: undefined }
  | { type: 'SHOW_TOAST'; payload: ShowToastPayload }
  | { type: 'COPY_TO_CLIPBOARD'; payload: { text: string } }
  | { type: 'SHARE'; payload: SharePayload }
  | { type: 'TRACK_EVENT'; payload: TrackEventPayload }
  | { type: 'TRACK_IMPRESSION'; payload: TrackEventPayload }
  | { type: 'RATE_APP'; payload?: undefined }
  // Campaign / Promotions
  | { type: 'DEEP_LINK'; payload: DeepLinkPayload }
  | { type: 'APPLY_MYSTERY_GIFT_COUPON'; payload: ApplyMysteryGiftCouponPayload };
