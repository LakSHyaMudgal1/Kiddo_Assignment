/**
 * DynamicCollection.tsx
 *
 * Production SDUI horizontal/vertical scrollable collection.
 * Supports five item kinds, all with working action dispatch.
 *
 * ─── Re-render isolation model ───────────────────────────────────────────────
 *
 * WHICH COMPONENTS SUBSCRIBE TO ZUSTAND AND WHY:
 *
 * ┌──────────────────────────────────────────────────────────────────────────┐
 * │ Component              │ Zustand subscription       │ Re-renders when    │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ DynamicCollection      │ NONE                       │ Only on node prop  │
 * │                        │                            │ change from server │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ CollectionProductItem  │ selectIsInCart(id, var)    │ Only when THIS     │
 * │                        │ selectIsInWishlist(id, var)│ product's cart or  │
 * │                        │                            │ wishlist state     │
 * │                        │                            │ changes            │
 * ├──────────────────────────────────────────────────────────────────────────┤
 * │ CollectionCategoryItem │ NONE                       │ Never (action only)│
 * │ CollectionBrandItem    │ NONE                       │ Never (action only)│
 * │ CollectionBannerItem   │ NONE                       │ Never (action only)│
 * │ CollectionMysteryItem  │ NONE                       │ Never (action only)│
 * └──────────────────────────────────────────────────────────────────────────┘
 *
 * Proof of isolation for product items:
 *   - Zustand notifies all subscribers on any state change
 *   - selectIsInCart('prod-001', 'var-001') returns a BOOLEAN
 *   - Zustand compares prev boolean === next boolean
 *   - For Product B's card: selectIsInCart('prod-002', ...) → false → false
 *   - Same result → Zustand skips scheduling a re-render for Product B
 *   - React.memo is a second gate: even if Zustand scheduled a re-render,
 *     `item` (stable server ref) hasn't changed → bail out
 *
 * ─── Nested scroll / gesture conflict strategy ───────────────────────────────
 *
 * DynamicCollection lives inside a vertical FlashList (SDUIPageRenderer).
 * A horizontal inner FlashList creates a gesture conflict on Android and
 * sometimes iOS where vertical swipes are captured by the inner list.
 *
 * Fix applied:
 *   - disableScrollViewPanResponder={true}  → inner list won't steal vertical
 *   - scrollEventThrottle={16}              → 60fps scroll events (no extra alloc)
 *   - decelerationRate="fast" for snap      → natural momentum feel
 *   - overScrollMode="never" on Android    → removes bounce jank
 *   - The outer FlashList uses scrollEnabled={true} (default) — unchanged
 *
 * ─── FlashList configuration choices ─────────────────────────────────────────
 *
 * estimatedItemSize:
 *   Set per-kind. FlashList needs this to pre-allocate scroll space.
 *   Under-estimating causes scroll jumps; over-estimating wastes memory.
 *   Values measured from layout dims defined below.
 *
 * getItemType:
 *   Returns item.kind. FlashList maintains one recycled view pool per type.
 *   Without this, a 152×232 product cell might be recycled into an 80×96
 *   category slot, causing layout flicker and incorrect hit areas.
 *
 * keyExtractor:
 *   Stable useCallback with [] deps. item.id is server-assigned and
 *   immutable within a session. FlashList uses this to diff the list.
 *
 * ItemSeparatorComponent:
 *   A module-level memoised component. NOT an inline arrow function.
 *   Inline arrows create a new function reference on every DynamicCollection
 *   render, causing FlashList to unmount and remount every separator.
 *
 * drawDistance / overrideItemLayout:
 *   Not set — FlashList infers from estimatedItemSize. This is correct for
 *   a horizontal list where all items of the same kind have the same width.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, {
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import type { SDUIComponentProps } from '@registry/componentRegistry';
import type {
  DynamicCollectionData,
  DynamicCollectionItem,
  CollectionProductItem,
  CollectionCategoryItem,
  CollectionBrandItem,
  CollectionBannerItem,
  CollectionMysteryGiftItem,
} from '@/types/components/DynamicCollection';
import type { SDUICardTheme } from '@/types/sdui-theme';
import type { AppAction } from '@actions/types';

import { useStore } from '@store/rootStore';
import { selectIsInCart } from '@store/selectors/cartSelectors';
import { selectIsInWishlist } from '@store/selectors/wishlistSelectors';
import { useActionDispatch } from '@context/ActionContext';
import { useTheme } from '@context/ThemeContext';
import { useNodeTheme, useCardTheme, resolveColor } from '@hooks/useNodeTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Default layout dimensions — used for estimatedItemSize and default sizing
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULTS = {
  product:      { width: 152, height: 232 },
  category:     { width: 80,  height: 96  },
  brand:        { width: 90,  height: 80  },
  banner:       { width: 220, height: 130 },
  mystery_gift: { width: 150, height: 170 },
} as const satisfies Record<DynamicCollectionItem['kind'], { width: number; height: number }>;

// ─────────────────────────────────────────────────────────────────────────────
// Stable separator — module-level memoised component
// ─────────────────────────────────────────────────────────────────────────────

const CollectionSeparator: React.FC<{ size: number; horizontal: boolean }> =
  React.memo(({ size, horizontal }) => (
    <View style={horizontal ? { width: size } : { height: size }} />
  ));
CollectionSeparator.displayName = 'CollectionSeparator';

// ─────────────────────────────────────────────────────────────────────────────
// Shared props passed to every item renderer
// ─────────────────────────────────────────────────────────────────────────────

interface ItemRendererProps<T extends DynamicCollectionItem> {
  item: T;
  itemWidth: number;
  itemHeight: number;
  cardTheme: SDUICardTheme | undefined;
  dispatch: (action: AppAction) => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// CollectionProductItem renderer
// Subscribes to store: isInCart + isWishlisted (per-item booleans only)
// ─────────────────────────────────────────────────────────────────────────────

const ProductItemRenderer: React.FC<ItemRendererProps<CollectionProductItem>> =
  React.memo(({ item, itemWidth, itemHeight, cardTheme, dispatch }) => {
    const { theme } = useTheme();
    const ct = useCardTheme(cardTheme);

    // ── Isolated store subscriptions (booleans) ───────────────────────────
    const isInCart = useStore(
      useMemo(() => selectIsInCart(item.productId, item.variantId), [item.productId, item.variantId]),
    );
    const isWishlisted = useStore(
      useMemo(() => selectIsInWishlist(item.productId, item.variantId), [item.productId, item.variantId]),
    );

    // ── Handlers — forward action, no business logic ──────────────────────
    const handleAddToCart = useCallback(() => {
      if (item.isOutOfStock) return;
      const action: AppAction = item.primaryAction ?? {
        type: 'ADD_TO_CART',
        payload: {
          productId: item.productId,
          variantId: item.variantId,
          sku: item.sku,
          name: item.name,
          imageUrl: item.image.uri,
          price: item.price.salePrice,
          originalPrice: item.price.originalPrice,
          quantity: 1,
          maxQuantity: 99,
        },
      };
      void dispatch(action);
    }, [item, dispatch]);

    const handleWishlist = useCallback(() => {
      const action: AppAction = isWishlisted
        ? { type: 'REMOVE_FROM_WISHLIST', payload: { productId: item.productId, variantId: item.variantId } }
        : { type: 'ADD_TO_WISHLIST',      payload: { productId: item.productId, variantId: item.variantId } };
      void dispatch(action);
    }, [item.productId, item.variantId, isWishlisted, dispatch]);

    const cardBg = ct.backgroundColor ?? theme.colors.surfaceDefault;
    const cardRadius = ct.borderRadius ?? theme.radii.md;

    return (
      <View
        testID={`collection-product-${item.id}`}
        style={[
          collectionStyles.productCard,
          {
            width: itemWidth,
            height: itemHeight,
            backgroundColor: cardBg,
            borderRadius: cardRadius,
            opacity: item.isOutOfStock ? 0.65 : 1,
            borderWidth: ct.bordered ? StyleSheet.hairlineWidth : 0,
            borderColor: ct.bordered ? ct.borderColor : undefined,
          },
        ]}
      >
        {/* Image */}
        <View style={[collectionStyles.productImageBox, { aspectRatio: ct.imageAspectRatio ?? 1 }]}>
          <Image
            source={{ uri: item.image.uri }}
            style={collectionStyles.productImage}
            resizeMode={item.image.resizeMode ?? 'cover'}
            accessibilityLabel={item.image.alt}
          />
          {item.isOutOfStock ? (
            <View style={collectionStyles.oosOverlay} pointerEvents="none">
              <Text style={[collectionStyles.oosText, { color: theme.colors.textDisabled }]}>Out of Stock</Text>
            </View>
          ) : null}
          {item.badge ? (
            <View
              style={[
                collectionStyles.badgeChip,
                item.badge.position === 'top_right' ? { right: 4, top: 4 } : { left: 4, top: 4 },
                {
                  backgroundColor: item.badge.theme.background
                    ? resolveColor(item.badge.theme.background, theme) ?? '#FF6B00'
                    : '#FF6B00',
                  borderRadius: item.badge.theme.borderRadius ?? 3,
                },
              ]}
            >
              <Text style={[
                collectionStyles.badgeText,
                { color: item.badge.theme.textColor ? resolveColor(item.badge.theme.textColor, theme) ?? '#FFF' : '#FFF' },
              ]}>
                {item.badge.label}
              </Text>
            </View>
          ) : null}
          {item.showWishlist ? (
            <TouchableOpacity
              onPress={handleWishlist}
              style={collectionStyles.wishlistBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              accessibilityRole="button"
            >
              <Text style={{ fontSize: 14, color: isWishlisted ? theme.colors.errorDefault : theme.colors.textTertiary }}>
                {isWishlisted ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Content */}
        <View style={collectionStyles.productContent}>
          <Text style={[collectionStyles.productName, { color: theme.colors.textPrimary }]} numberOfLines={2}>
            {item.name}
          </Text>
          <View style={collectionStyles.priceRow}>
            <Text style={[collectionStyles.salePrice, { color: theme.colors.errorDefault }]}>
              {item.price.currency}{item.price.salePrice}
            </Text>
            {item.price.discountLabel ? (
              <Text style={[collectionStyles.discountBadge, { color: theme.colors.successDefault }]}>
                {item.price.discountLabel}
              </Text>
            ) : null}
          </View>
          {!item.isOutOfStock ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              style={[
                collectionStyles.atcBtn,
                { backgroundColor: isInCart ? theme.colors.successSubtle : theme.colors.interactivePrimary },
              ]}
              accessibilityLabel={isInCart ? 'In cart' : `Add ${item.name} to cart`}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={[
                collectionStyles.atcText,
                { color: isInCart ? theme.colors.successDefault : theme.colors.textOnBrand },
              ]}>
                {isInCart ? '✓' : '+'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    );
  });
ProductItemRenderer.displayName = 'CollectionProductItem';

// ─────────────────────────────────────────────────────────────────────────────
// CollectionCategoryItem renderer
// NO store subscription — action dispatched on tap, nothing to observe
// ─────────────────────────────────────────────────────────────────────────────

const CategoryItemRenderer: React.FC<ItemRendererProps<CollectionCategoryItem>> =
  React.memo(({ item, itemWidth, itemHeight, dispatch }) => {
    const { theme } = useTheme();

    const handlePress = useCallback(() => {
      void dispatch(item.action as AppAction);
    }, [item.action, dispatch]);

    const circleBg = item.backgroundColor
      ? resolveColor(item.backgroundColor, theme) ?? theme.colors.bgTertiary
      : theme.colors.bgTertiary;

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[collectionStyles.categoryItem, { width: itemWidth, height: itemHeight }]}
        activeOpacity={0.75}
        accessibilityLabel={item.label}
        accessibilityRole="button"
        testID={`collection-category-${item.id}`}
      >
        <View style={[collectionStyles.categoryCircle, { backgroundColor: circleBg }]}>
          {item.image ? (
            <Image
              source={{ uri: item.image.uri }}
              style={collectionStyles.categoryCircleImage}
              resizeMode="cover"
              accessibilityLabel={item.label}
            />
          ) : null}
        </View>
        <Text
          style={[collectionStyles.categoryLabel, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  });
CategoryItemRenderer.displayName = 'CollectionCategoryItem';

// ─────────────────────────────────────────────────────────────────────────────
// CollectionBrandItem renderer — NO store subscription
// ─────────────────────────────────────────────────────────────────────────────

const BrandItemRenderer: React.FC<ItemRendererProps<CollectionBrandItem>> =
  React.memo(({ item, itemWidth, itemHeight, dispatch }) => {
    const { theme } = useTheme();

    const handlePress = useCallback(() => {
      void dispatch(item.action as AppAction);
    }, [item.action, dispatch]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          collectionStyles.brandItem,
          {
            width: itemWidth,
            height: itemHeight,
            backgroundColor: theme.colors.surfaceDefault,
            borderColor: theme.colors.borderDefault,
          },
        ]}
        activeOpacity={0.8}
        accessibilityLabel={item.name}
        accessibilityRole="button"
        testID={`collection-brand-${item.id}`}
      >
        <Image
          source={{ uri: item.logoImage.uri }}
          style={collectionStyles.brandLogo}
          resizeMode="contain"
          accessibilityLabel={item.name}
        />
        {item.tagline ? (
          <Text style={[collectionStyles.brandTagline, { color: theme.colors.textTertiary }]} numberOfLines={1}>
            {item.tagline}
          </Text>
        ) : null}
      </TouchableOpacity>
    );
  });
BrandItemRenderer.displayName = 'CollectionBrandItem';

// ─────────────────────────────────────────────────────────────────────────────
// CollectionBannerItem renderer — NO store subscription
// ─────────────────────────────────────────────────────────────────────────────

const BannerItemRenderer: React.FC<ItemRendererProps<CollectionBannerItem>> =
  React.memo(({ item, itemWidth, itemHeight, cardTheme, dispatch }) => {
    const { theme } = useTheme();
    const ct = useCardTheme(cardTheme);

    const handlePress = useCallback(() => {
      void dispatch(item.action as AppAction);
    }, [item.action, dispatch]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          collectionStyles.bannerItem,
          {
            width: itemWidth,
            height: itemHeight,
            borderRadius: ct.borderRadius ?? theme.radii.md,
          },
        ]}
        activeOpacity={0.9}
        accessibilityLabel={item.title ?? 'Banner'}
        accessibilityRole="button"
        testID={`collection-banner-${item.id}`}
      >
        <Image
          source={{ uri: item.image.uri }}
          style={collectionStyles.bannerImage}
          resizeMode={item.image.resizeMode ?? 'cover'}
          accessibilityLabel={item.image.alt}
        />
        {item.badge ? (
          <View
            style={[
              collectionStyles.bannerBadge,
              {
                backgroundColor: item.badge.theme.background
                  ? resolveColor(item.badge.theme.background, theme) ?? '#E53935'
                  : '#E53935',
              },
            ]}
          >
            <Text style={[
              collectionStyles.badgeText,
              { color: item.badge.theme.textColor ? resolveColor(item.badge.theme.textColor, theme) ?? '#FFF' : '#FFF' },
            ]}>
              {item.badge.label}
            </Text>
          </View>
        ) : null}
        {item.title ? (
          <View style={collectionStyles.bannerOverlay} pointerEvents="none">
            <Text style={collectionStyles.bannerTitle} numberOfLines={1}>{item.title}</Text>
            {item.subtitle ? (
              <Text style={collectionStyles.bannerSubtitle} numberOfLines={1}>{item.subtitle}</Text>
            ) : null}
          </View>
        ) : null}
      </TouchableOpacity>
    );
  });
BannerItemRenderer.displayName = 'CollectionBannerItem';

// ─────────────────────────────────────────────────────────────────────────────
// CollectionMysteryGiftItem renderer — NO store subscription
// Always dispatches APPLY_MYSTERY_GIFT_COUPON
// ─────────────────────────────────────────────────────────────────────────────

const MysteryGiftItemRenderer: React.FC<ItemRendererProps<CollectionMysteryGiftItem>> =
  React.memo(({ item, itemWidth, itemHeight, cardTheme, dispatch }) => {
    const { theme } = useTheme();
    const ct = useCardTheme(cardTheme);

    const handlePress = useCallback(() => {
      void dispatch(item.action as AppAction);
    }, [item.action, dispatch]);

    const cardBg = ct.backgroundColor ?? '#F3E5F5';
    const cardRadius = ct.borderRadius ?? 12;

    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          collectionStyles.mysteryItem,
          {
            width: itemWidth,
            height: itemHeight,
            backgroundColor: cardBg,
            borderRadius: cardRadius,
            borderColor: theme.colors.brandPrimary,
          },
        ]}
        activeOpacity={0.85}
        accessibilityLabel={item.teaserLabel}
        accessibilityRole="button"
        testID={`collection-mystery-${item.id}`}
      >
        {item.teaserImage ? (
          <Image
            source={{ uri: item.teaserImage.uri }}
            style={[collectionStyles.mysteryImage, { borderRadius: cardRadius }]}
            resizeMode="contain"
            accessibilityLabel="Mystery gift"
          />
        ) : (
          <Text style={collectionStyles.mysteryEmoji}>🎁</Text>
        )}
        <Text
          style={[collectionStyles.mysteryLabel, { color: theme.colors.textPrimary }]}
          numberOfLines={2}
        >
          {item.teaserLabel}
        </Text>
        <View style={[collectionStyles.mysteryRevealBtn, { backgroundColor: theme.colors.brandPrimary }]}>
          <Text style={[collectionStyles.mysteryRevealText, { color: theme.colors.brandOnPrimary }]}>
            Tap to Reveal
          </Text>
        </View>
      </TouchableOpacity>
    );
  });
MysteryGiftItemRenderer.displayName = 'CollectionMysteryGiftItem';

// ─────────────────────────────────────────────────────────────────────────────
// Item renderer registry — factory object, no switch
// ─────────────────────────────────────────────────────────────────────────────

// Each entry is typed so the Renderer receives the correctly narrowed item type.
// The cast at call-site is safe because we index by item.kind.
const ITEM_RENDERER_MAP = {
  product:      ProductItemRenderer,
  category:     CategoryItemRenderer,
  brand:        BrandItemRenderer,
  banner:       BannerItemRenderer,
  mystery_gift: MysteryGiftItemRenderer,
} as const satisfies Record<
  DynamicCollectionItem['kind'],
  React.FC<ItemRendererProps<any>>
>;

// ─────────────────────────────────────────────────────────────────────────────
// Auto-advance hook (carousel)
// ─────────────────────────────────────────────────────────────────────────────

function useAutoAdvance(
  enabled: boolean,
  intervalMs: number,
  itemCount: number,
  listRef: React.RefObject<FlashList<DynamicCollectionItem>>,
): void {
  const indexRef = useRef(0);

  useEffect(() => {
    if (!enabled || intervalMs <= 0 || itemCount < 2) return;

    const timer = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % itemCount;
      listRef.current?.scrollToIndex({ index: indexRef.current, animated: true });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [enabled, intervalMs, itemCount, listRef]);
}

// ─────────────────────────────────────────────────────────────────────────────
// DynamicCollection — main SDUI component
// ─────────────────────────────────────────────────────────────────────────────

type Props = SDUIComponentProps<DynamicCollectionData>;

export const DynamicCollection: React.FC<Props> = React.memo(({ id, data, testID }) => {
  const {
    header,
    items,
    layout,
    cardTheme,
    theme: nodeThemeOverride,
    emptyState,
  } = data;

  const {
    scrollDirection,
    itemWidth,
    itemHeight,
    gutter = 12,
    leadingPadding = 16,
    snapToItem = false,
    autoAdvanceInterval = 0,
  } = layout;

  const isHorizontal = scrollDirection === 'horizontal';
  const listRef = useRef<FlashList<DynamicCollectionItem>>(null);

  // ── Theme ──────────────────────────────────────────────────────────────
  const nodeTheme = useNodeTheme(nodeThemeOverride);
  const { theme } = useTheme();

  // ── Dispatch — stable context singleton ref ────────────────────────────
  const dispatch = useActionDispatch();

  // ── Auto-advance for carousels ─────────────────────────────────────────
  useAutoAdvance(
    isHorizontal && autoAdvanceInterval > 0,
    autoAdvanceInterval,
    items.length,
    listRef,
  );

  // ── FlashList: getItemType — one pool per item kind ────────────────────
  // Without this, FlashList might recycle a 152×232 product cell into an
  // 80×96 category slot, causing layout measurement errors.
  const getItemType = useCallback(
    (item: DynamicCollectionItem): string => item.kind,
    [],
  );

  // ── FlashList: estimatedItemSize ───────────────────────────────────────
  // For a horizontal list this is the item WIDTH.
  // For a vertical list this is the item HEIGHT.
  // We derive from the first item's kind because all items in a collection
  // share the same kind (enforced by collectionKind discriminant).
  const firstKind = items[0]?.kind ?? 'product';
  const estimatedItemSize = isHorizontal
    ? (itemWidth ?? DEFAULTS[firstKind].width)
    : (itemHeight ?? DEFAULTS[firstKind].height);

  // ── FlashList: keyExtractor — stable, item.id is immutable ────────────
  const keyExtractor = useCallback(
    (item: DynamicCollectionItem) => item.id,
    [],
  );

  // ── FlashList: renderItem — factory dispatch, no switch ───────────────
  // Closes over cardTheme and dispatch which are both stable references.
  // itemWidth/itemHeight come from layout which is stable per server payload.
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<DynamicCollectionItem>) => {
      const w = itemWidth ?? DEFAULTS[item.kind].width;
      const h = itemHeight ?? DEFAULTS[item.kind].height;

      // Factory lookup — O(1), no switch
      const Renderer = ITEM_RENDERER_MAP[item.kind] as React.FC<
        ItemRendererProps<typeof item>
      >;

      return (
        <Renderer
          item={item}
          itemWidth={w}
          itemHeight={h}
          cardTheme={cardTheme}
          dispatch={dispatch}
        />
      );
    },
    [itemWidth, itemHeight, cardTheme, dispatch],
  );

  // ── FlashList: ItemSeparatorComponent — stable useMemo ─────────────────
  // useMemo returns a stable component reference that only changes if gutter
  // or scroll direction change (which requires a full re-render anyway).
  const ItemSeparator = useMemo(
    () => () => <CollectionSeparator size={gutter} horizontal={isHorizontal} />,
    [gutter, isHorizontal],
  );

  // ── Header "See All" handler ───────────────────────────────────────────
  const handleSeeAll = useCallback(() => {
    if (header?.seeAllAction) void dispatch(header.seeAllAction as AppAction);
  }, [header?.seeAllAction, dispatch]);

  // ── Container styles ───────────────────────────────────────────────────
  const containerBg = nodeTheme.backgroundColor ?? theme.colors.bgPrimary;
  const containerPad = nodeTheme.padding;

  // ── Empty state ────────────────────────────────────────────────────────
  if (items.length === 0) {
    const msg = emptyState?.message ?? 'Nothing here yet';
    return (
      <View
        testID={testID ?? `dynamic-collection-${id}`}
        style={[collectionStyles.emptyContainer, { backgroundColor: containerBg }]}
      >
        <Text style={[collectionStyles.emptyText, { color: theme.colors.textTertiary }]}>
          {msg}
        </Text>
      </View>
    );
  }

  return (
    <View
      testID={testID ?? `dynamic-collection-${id}`}
      style={[
        collectionStyles.container,
        {
          backgroundColor: containerBg,
          opacity: nodeTheme.opacity ?? 1,
          paddingTop: containerPad?.top ?? 0,
          paddingBottom: containerPad?.bottom ?? 8,
        },
      ]}
    >
      {/* Section header */}
      {header ? (
        <View style={collectionStyles.headerRow}>
          <View style={collectionStyles.headerTextBlock}>
            <Text
              style={[collectionStyles.headerTitle, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {header.title}
            </Text>
            {header.subtitle ? (
              <Text
                style={[collectionStyles.headerSubtitle, { color: theme.colors.textSecondary }]}
                numberOfLines={1}
              >
                {header.subtitle}
              </Text>
            ) : null}
          </View>
          {header.seeAllAction ? (
            <TouchableOpacity
              onPress={handleSeeAll}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel={header.seeAllLabel ?? 'See All'}
              accessibilityRole="link"
            >
              <Text style={[collectionStyles.seeAll, { color: theme.colors.brandPrimary }]}>
                {header.seeAllLabel ?? 'See All'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* FlashList */}
      <FlashList
        ref={listRef}
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        horizontal={isHorizontal}
        estimatedItemSize={estimatedItemSize}
        ItemSeparatorComponent={ItemSeparator}
        contentContainerStyle={{
          paddingLeft:   isHorizontal ? leadingPadding : 0,
          paddingRight:  isHorizontal ? 16 : 0,
          paddingTop:    isHorizontal ? 0  : leadingPadding,
          paddingBottom: 4,
        }}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        // ── Nested scroll / gesture conflict fixes ──────────────────────
        // disableScrollViewPanResponder prevents the inner horizontal FlashList
        // from intercepting vertical swipes meant for the outer vertical list.
        // Without this, vertical scrolls stutter on Android.
        disableScrollViewPanResponder={isHorizontal}
        // scrollEventThrottle: 16ms = 60fps updates, minimal JS thread load
        scrollEventThrottle={16}
        // decelerationRate: "fast" gives the snappy feel expected in
        // production carousels (Blinkit / Swiggy style)
        decelerationRate={snapToItem ? 'fast' : 'normal'}
        // snapToInterval: exact item width + separator to snap cell-by-cell
        snapToInterval={
          snapToItem && isHorizontal
            ? (itemWidth ?? DEFAULTS[firstKind].width) + gutter
            : undefined
        }
        snapToAlignment="start"
        // overScrollMode="never" removes the Android edge glow that looks
        // wrong inside a nested scroll container
        overScrollMode="never"
        // removeClippedSubviews=false inside a nested FlashList — see audit
        removeClippedSubviews={false}
        // bounces=false prevents the iOS rubber-band from fighting the outer
        // scroll view's own bouncing
        bounces={false}
      />
    </View>
  );
});

DynamicCollection.displayName = 'DynamicCollection';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const collectionStyles = StyleSheet.create({
  container: { marginVertical: 6 },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTextBlock: { flex: 1, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  seeAll: { fontSize: 13, fontWeight: '600' },

  // Empty state
  emptyContainer: { padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 13 },

  // Product item
  productCard: {
    overflow: 'hidden',
    ...Platform.select({
      android: { elevation: 2 },
      ios: {},
    }),
  },
  productImageBox: { width: '100%', backgroundColor: '#F5F5F5', position: 'relative' },
  productImage: { width: '100%', height: '100%' },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oosText: { fontSize: 10, fontWeight: '700' },
  badgeChip: { position: 'absolute', paddingHorizontal: 5, paddingVertical: 2 },
  badgeText: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
  wishlistBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productContent: { flex: 1, padding: 6 },
  productName: { fontSize: 11, fontWeight: '600', lineHeight: 15, marginBottom: 3 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  salePrice: { fontSize: 12, fontWeight: '800' },
  discountBadge: { fontSize: 9, fontWeight: '700' },
  atcBtn: {
    paddingVertical: 5,
    alignItems: 'center',
    borderRadius: 4,
    marginTop: 'auto',
  },
  atcText: { fontSize: 12, fontWeight: '700' },

  // Category item
  categoryItem: { alignItems: 'center', justifyContent: 'flex-start', paddingTop: 4 },
  categoryCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryCircleImage: { width: '100%', height: '100%' },
  categoryLabel: { fontSize: 11, textAlign: 'center', fontWeight: '500', paddingHorizontal: 4 },

  // Brand item
  brandItem: {
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    overflow: 'hidden',
  },
  brandLogo: { width: 60, height: 36 },
  brandTagline: { fontSize: 9, marginTop: 4, textAlign: 'center' },

  // Banner item
  bannerItem: { overflow: 'hidden' },
  bannerImage: { width: '100%', height: '100%' },
  bannerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  bannerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bannerTitle: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  bannerSubtitle: { fontSize: 11, color: 'rgba(255,255,255,0.85)', marginTop: 2 },

  // Mystery gift item
  mysteryItem: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  mysteryImage: { width: 72, height: 72, marginBottom: 8 },
  mysteryEmoji: { fontSize: 40, marginBottom: 8 },
  mysteryLabel: { fontSize: 12, fontWeight: '700', textAlign: 'center', paddingHorizontal: 10 },
  mysteryRevealBtn: {
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  mysteryRevealText: { fontSize: 11, fontWeight: '700' },
});
