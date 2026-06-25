import type { AppAction } from './types';
import {
  handleNavigate,
  handleNavigateBack,
  handleOpenExternalUrl,
  handleOpenBottomSheet,
  handleCloseBottomSheet,
} from './handlers/navigationHandlers';
import {
  handleAddToCart,
  handleRemoveFromCart,
  handleUpdateCartQuantity,
  handleClearCart,
  handleApplyCoupon,
} from './handlers/cartHandlers';
import {
  handleAddToWishlist,
  handleRemoveFromWishlist,
} from './handlers/wishlistHandlers';
import type { SDUIAction } from '../registry/types';
import {
  handleShowToast,
  handleCopyToClipboard,
  handleShare,
} from './handlers/uiHandlers';
import { Linking } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '@store/rootStore';

/**
 * ActionDispatcher
 *
 * The single entry point for all SDUI-triggered actions.
 * Components never import handlers directly — they call dispatch().
 *
 * This pattern gives us:
 *  - Centralised middleware (analytics, logging, auth guards)
 *  - Easy mocking in tests
 *  - Server-driven actions that map to typed local handlers
 */
class ActionDispatcherClass {
  /**
   * Middleware stack — runs before every action.
   * Middleware can return false to cancel the action.
   */
  private readonly _middleware: Array<
    (action: AppAction) => boolean | Promise<boolean>
  > = [];

  /**
   * Add middleware to the stack.
   * Middleware runs in insertion order.
   */
  use(fn: (action: AppAction) => boolean | Promise<boolean>): void {
    this._middleware.push(fn);
  }

  /**
   * Dispatch a typed action.
   */
  async dispatch(action: AppAction): Promise<void> {
    // Run middleware
    for (const mw of this._middleware) {
      const shouldContinue = await mw(action);
      if (!shouldContinue) {
        if (__DEV__) {
          console.log(`[ActionDispatcher] Action cancelled by middleware:`, action.type);
        }
        return;
      }
    }

    if (__DEV__) {
      console.log(`[ActionDispatcher] dispatch →`, action.type, action.payload ?? '');
    }

    switch (action.type) {
      // Navigation
      case 'NAVIGATE':
        return handleNavigate(action.payload);
      case 'NAVIGATE_BACK':
        return handleNavigateBack();
      case 'OPEN_EXTERNAL_URL':
        return handleOpenExternalUrl(action.payload);
      case 'OPEN_BOTTOM_SHEET':
        return handleOpenBottomSheet(action.payload);
      case 'CLOSE_BOTTOM_SHEET':
        return handleCloseBottomSheet();

      // Cart
      case 'ADD_TO_CART':
        return handleAddToCart(action.payload);
      case 'REMOVE_FROM_CART':
        return handleRemoveFromCart(action.payload);
      case 'UPDATE_CART_QUANTITY':
        return handleUpdateCartQuantity(action.payload);
      case 'CLEAR_CART':
        return handleClearCart();
      case 'APPLY_COUPON':
        return handleApplyCoupon(action.payload);

      // Wishlist
      case 'ADD_TO_WISHLIST':
        return handleAddToWishlist(action.payload);
      case 'REMOVE_FROM_WISHLIST':
        return handleRemoveFromWishlist(action.payload);

      // Auth
      case 'LOGOUT':
        useStore.getState().logout();
        return;
      case 'OPEN_LOGIN':
        handleNavigate({ route: '/(auth)/login' });
        return;

      // UI
      case 'SHOW_TOAST':
        return handleShowToast(action.payload);
      case 'COPY_TO_CLIPBOARD':
        return handleCopyToClipboard(action.payload);
      case 'SHARE':
        return handleShare(action.payload);

      // Analytics (no-op skeleton — wire to real analytics in analytics middleware)
      case 'TRACK_EVENT':
      case 'TRACK_IMPRESSION':
        return;

      // Misc
      case 'RATE_APP':
        return;

      // Campaign / Promotions
      case 'DEEP_LINK': {
        const { uri, fallbackRoute, params } = action.payload;
        const canOpen = await Linking.canOpenURL(uri);
        if (canOpen) {
          await Linking.openURL(uri);
        } else if (fallbackRoute) {
          router.push({
            pathname: fallbackRoute as never,
            ...(params ? { params: params as any } : {}),
          });
        } else if (__DEV__) {
          console.warn(`[ActionDispatcher] DEEP_LINK: cannot open URI "${uri}" and no fallback set`);
        }
        return;
      }

      case 'APPLY_MYSTERY_GIFT_COUPON': {
        const { campaignId, minCartValue, successMessage, failureMessage } = action.payload;
        const { items } = useStore.getState();
        const cartTotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

        if (minCartValue !== undefined && cartTotal < minCartValue) {
          useStore.getState().showToast({
            message: failureMessage ?? `Add ₹${minCartValue - cartTotal} more to unlock your gift`,
            variant: 'warning',
          });
          return;
        }

        // The actual coupon code is resolved server-side via an API call.
        // Here we just trigger the API and let the response update the store.
        // TODO: replace with real API call to /campaigns/:campaignId/mystery-coupon
        if (__DEV__) {
          console.log(`[ActionDispatcher] APPLY_MYSTERY_GIFT_COUPON → campaignId: ${campaignId}`);
        }
        useStore.getState().showToast({
          message: successMessage ?? '🎁 Your mystery gift has been applied!',
          variant: 'success',
        });
        return;
      }

        default: {
          if (__DEV__) {
            console.warn('[ActionDispatcher] Unhandled action type:', action.type);
          }
        }
    }
  }

  /**
   * Convenience: dispatch from a raw SDUI action node
   * (server payload, not yet narrowed to AppAction).
   */
  async dispatchSDUI(action: SDUIAction): Promise<void> {
    await this.dispatch({
      type: action.type as AppAction['type'],
      payload: action.payload as never,
    });
  }
}

export const ActionDispatcher = new ActionDispatcherClass();

// ---------------------------------------------------------------------------
// Built-in middleware: Analytics logger (skeleton)
// ---------------------------------------------------------------------------
ActionDispatcher.use((action) => {
  // TODO: wire to Amplitude / Firebase Analytics / Segment
  // analyticsService.track(action.type, action.payload);
  return true; // always continue
});
