/**
 * ProductGrid2x2.tsx
 *
 * Production-quality 2-column SDUI product grid.
 *
 * ─── Re-render isolation ─────────────────────────────────────────────────────
 *
 * The core problem: a single Zustand store holds cart + wishlist state.
 * Any mutation (addItem, addToWishlist) triggers all store subscribers.
 * With 52 products rendered, that means 52 ProductCard re-renders per tap
 * unless we isolate subscriptions.
 *
 * How isolation is achieved here:
 *
 * 1. ProductCard calls useStore(selectIsInCart(productId, variantId))
 *    This creates a selector that returns a boolean for THIS card only.
 *    Zustand compares the previous boolean to the new boolean before
 *    scheduling a re-render. Cards whose in-cart status didn't change
 *    return the same boolean → React.memo sees identical props → skips render.
 *
 * 2. Same pattern for wishlist: useStore(selectIsInWishlist(productId, variantId))
 *    Adding Product A to wishlist only re-renders Product A's card.
 *
 * 3. ProductGrid2x2 itself never subscribes to the store at all.
 *    It reads only data.items (from the server payload) and data.cardTheme.
 *    Cart mutations don't touch these → ProductGrid2x2 never re-renders
 *    from store changes.
 *
 * 4. React.memo on ProductCard with default shallow comparator.
 *    `item` is a stable object reference from the payload (never mutated).
 *    `cardTheme` and `dispatch` are stable references (memo + useCallback).
 *    Only `isInCart` and `isInWishlist` booleans change → only those cards
 *    whose state actually changed go through reconciliation.
 *
 * ─── FlashList optimizations ─────────────────────────────────────────────────
 *
 * - estimatedItemSize: 300 (image 160 + name 36 + price 24 + CTA 44 + pad 36)
 * - getItemType: distinguishes in-stock vs out-of-stock cells (different heights)
 * - ItemSeparatorComponent: module-level stable component, never recreated
 * - keyExtractor: useCallback with [] deps — stable forever
 * - renderItem: useCallback with [] deps — ProductCard is self-contained
 * - scrollEnabled={false}: parent FlashList/ScrollView owns scroll
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';

import type { SDUIComponentProps } from '@registry/componentRegistry';
import type {
  ProductGrid2x2Data,
  ProductGridItem,
  ProductGridBadge,
} from '@/types/components/ProductGrid2x2';
import type { SDUICardTheme } from '@/types/sdui-theme';
import type { AppAction } from '@actions/types';

import { useStore } from '@store/rootStore';
import { selectIsInCart } from '@store/selectors/cartSelectors';
import { selectIsInWishlist } from '@store/selectors/wishlistSelectors';
import { useActionDispatch } from '@context/ActionContext';
import { useTheme } from '@context/ThemeContext';
import { useNodeTheme, useCardTheme, resolveColor } from '@hooks/useNodeTheme';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * FlashList estimated row height.
 * Breakdown: image(160) + name(36) + brand(16) + price(24) + rating(16)
 *            + badge(18) + CTA(44) + padding(36) = 350
 * Out-of-stock cards are shorter (no CTA) — handled by getItemType.
 */
const ESTIMATED_ITEM_SIZE = 350;
const ITEM_TYPE_IN_STOCK = 'in_stock';
const ITEM_TYPE_OUT_OF_STOCK = 'out_of_stock';

// ─────────────────────────────────────────────────────────────────────────────
// Stable separator component — module-level, never recreated
// ─────────────────────────────────────────────────────────────────────────────

const RowSeparator: React.FC<{ height: number }> = React.memo(({ height }) => (
  <View style={{ height }} />
));
RowSeparator.displayName = 'RowSeparator';

// ─────────────────────────────────────────────────────────────────────────────
// BadgeView — stateless, no store subscription
// ─────────────────────────────────────────────────────────────────────────────

interface BadgeViewProps {
  badge: ProductGridBadge;
}

const BadgeView: React.FC<BadgeViewProps> = React.memo(({ badge }) => {
  const { theme } = useTheme();
  const bg = badge.theme.background
    ? resolveColor(badge.theme.background, theme) ?? '#FF6B00'
    : '#FF6B00';
  const tc = badge.theme.textColor
    ? resolveColor(badge.theme.textColor, theme) ?? '#FFFFFF'
    : '#FFFFFF';
  const br = badge.theme.borderRadius ?? 3;

  const positionStyle = {
    top_left:     { top: 8, left: 8 },
    top_right:    { top: 8, right: 8 },
    bottom_left:  { bottom: 8, left: 8 },
    bottom_right: { bottom: 8, right: 8 },
  }[badge.position];

  return (
    <View
      style={[
        cardStyles.badgeContainer,
        positionStyle,
        { backgroundColor: bg, borderRadius: br },
      ]}
    >
      <Text style={[cardStyles.badgeText, { color: tc }]}>{badge.label}</Text>
    </View>
  );
});
BadgeView.displayName = 'BadgeView';

// ─────────────────────────────────────────────────────────────────────────────
// RatingStars — stateless
// ─────────────────────────────────────────────────────────────────────────────

const RatingStars: React.FC<{ rating: number; reviewCount?: number | undefined }> =
  React.memo(({ rating, reviewCount }) => {
    const stars = '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
    return (
      <View style={cardStyles.ratingRow}>
        <Text style={cardStyles.ratingStars}>{stars}</Text>
        <Text style={cardStyles.ratingValue}>{rating.toFixed(1)}</Text>
        {reviewCount !== undefined ? (
          <Text style={cardStyles.reviewCount}>({reviewCount.toLocaleString()})</Text>
        ) : null}
      </View>
    );
  });
RatingStars.displayName = 'RatingStars';

// ─────────────────────────────────────────────────────────────────────────────
// ProductCard
//
// ISOLATION CONTRACT:
//   - Subscribes to store for exactly two boolean values:
//       isInCart   = useStore(selectIsInCart(productId, variantId))
//       isWishlisted = useStore(selectIsInWishlist(productId, variantId))
//   - `item` and `cardTheme` are stable server-payload refs — never mutated
//   - `dispatch` comes from ActionContext — stable singleton ref
//   - React.memo re-renders ONLY when isInCart/isWishlisted booleans change
// ─────────────────────────────────────────────────────────────────────────────

interface ProductCardProps {
  item: ProductGridItem;
  cardTheme: SDUICardTheme | undefined;
  dispatch: (action: AppAction) => Promise<void>;
}

const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ item, cardTheme, dispatch }) => {
    // ── Isolated store subscriptions ──────────────────────────────────────
    // Each card subscribes to a BOOLEAN for its own product+variant only.
    // Zustand checks prev === next before scheduling re-render.
    // When Product B is added to cart, Product A's selector still returns
    // the same boolean → no re-render for Product A.
    const isInCart = useStore(
      useMemo(
        () => selectIsInCart(item.productId, item.variantId),
        [item.productId, item.variantId],
      ),
    );
    const isWishlisted = useStore(
      useMemo(
        () => selectIsInWishlist(item.productId, item.variantId),
        [item.productId, item.variantId],
      ),
    );

    // ── Theme ─────────────────────────────────────────────────────────────
    const { theme } = useTheme();
    const ct = useCardTheme(cardTheme);

    // ── Action handlers — no business logic here ──────────────────────────
    // The card forwards the action payload exactly as the server sent it.
    // All business logic (inventory check, auth guard) lives in ActionDispatcher.
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
        : { type: 'ADD_TO_WISHLIST',    payload: { productId: item.productId, variantId: item.variantId } };
      void dispatch(action);
    }, [item.productId, item.variantId, isWishlisted, dispatch]);

    // ── Derived styles ────────────────────────────────────────────────────
    const cardBg = ct.backgroundColor ?? theme.colors.surfaceDefault;
    const cardRadius = ct.borderRadius ?? theme.radii.md;
    const elevation = ct.elevation ?? 1;
    const contentPad = ct.contentPadding ?? { top: 8, right: 8, bottom: 10, left: 8 };
    const bordered = ct.bordered;
    const borderColor = ct.borderColor ?? theme.colors.borderDefault;
    const imageAspect = ct.imageAspectRatio ?? 1;

    const shadowStyle = elevation > 0
      ? theme.shadows[
          ((['xs', 'sm', 'md', 'lg', 'xl', '2xl'] as const)[
            Math.min(elevation, 5) - 1
          ] ?? 'xs')
        ]
      : {};

    return (
      <View
        testID={`product-card-${item.id}`}
        accessibilityLabel={item.name}
        style={[
          cardStyles.card,
          {
            backgroundColor: cardBg,
            borderRadius: cardRadius,
            borderWidth: bordered ? StyleSheet.hairlineWidth : 0,
            borderColor: bordered ? borderColor : undefined,
            opacity: item.isOutOfStock ? 0.6 : 1,
          },
          shadowStyle,
        ]}
      >
        {/* ── Image region ──────────────────────────────────────────────── */}
        <View style={[cardStyles.imageContainer, { aspectRatio: imageAspect }]}>
          <Image
            source={{ uri: item.image.uri }}
            style={cardStyles.image}
            resizeMode={item.image.resizeMode ?? 'cover'}
            accessibilityLabel={item.image.alt}
          />

          {/* Out-of-stock overlay */}
          {item.isOutOfStock ? (
            <View style={cardStyles.oosOverlay} pointerEvents="none">
              <Text style={cardStyles.oosText}>Out of Stock</Text>
            </View>
          ) : null}

          {/* Badge — positioned absolute over image */}
          {item.badge ? <BadgeView badge={item.badge} /> : null}

          {/* Wishlist heart */}
          {item.showWishlist ? (
            <TouchableOpacity
              onPress={handleWishlist}
              style={cardStyles.wishlistBtn}
              hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
              accessibilityLabel={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
              accessibilityRole="button"
            >
              <Text style={[
                cardStyles.wishlistIcon,
                { color: isWishlisted ? theme.colors.errorDefault : theme.colors.textTertiary },
              ]}>
                {isWishlisted ? '♥' : '♡'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ── Content region ────────────────────────────────────────────── */}
        <View style={[
          cardStyles.content,
          {
            paddingTop: contentPad.top ?? 8,
            paddingRight: contentPad.right ?? 8,
            paddingBottom: contentPad.bottom ?? 10,
            paddingLeft: contentPad.left ?? 8,
          },
        ]}>
          {/* Brand */}
          {item.brandName ? (
            <Text style={[cardStyles.brand, { color: theme.colors.textTertiary }]} numberOfLines={1}>
              {item.brandName}
            </Text>
          ) : null}

          {/* Product name */}
          <Text
            style={[cardStyles.name, { color: theme.colors.textPrimary }]}
            numberOfLines={2}
          >
            {item.name}
          </Text>

          {/* Rating */}
          {item.rating !== undefined ? (
            <RatingStars rating={item.rating} reviewCount={item.reviewCount} />
          ) : null}

          {/* Price row */}
          <View style={cardStyles.priceRow}>
            <Text style={[cardStyles.salePrice, { color: theme.colors.errorDefault }]}>
              {item.price.currency}{item.price.salePrice}
            </Text>
            {item.price.originalPrice !== undefined ? (
              <Text style={[cardStyles.originalPrice, { color: theme.colors.textDisabled }]}>
                {item.price.currency}{item.price.originalPrice}
              </Text>
            ) : null}
            {item.price.discountLabel ? (
              <Text style={[cardStyles.discountLabel, { color: theme.colors.successDefault }]}>
                {item.price.discountLabel}
              </Text>
            ) : null}
          </View>

          {/* Add to Cart / In Cart button */}
          {!item.isOutOfStock ? (
            <TouchableOpacity
              onPress={handleAddToCart}
              style={[
                cardStyles.ctaButton,
                {
                  backgroundColor: isInCart
                    ? theme.colors.successSubtle
                    : theme.colors.interactivePrimary,
                  borderRadius: cardRadius > 8 ? 6 : 4,
                },
              ]}
              accessibilityLabel={isInCart ? 'In cart' : `Add ${item.name} to cart`}
              accessibilityRole="button"
              activeOpacity={0.8}
            >
              <Text style={[
                cardStyles.ctaText,
                { color: isInCart ? theme.colors.successDefault : theme.colors.textOnBrand },
              ]}>
                {isInCart ? '✓ In Cart' : '+ Add to Cart'}
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={[cardStyles.ctaButton, cardStyles.ctaDisabled, { borderRadius: cardRadius > 8 ? 6 : 4 }]}>
              <Text style={[cardStyles.ctaText, { color: theme.colors.textDisabled }]}>
                Out of Stock
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  },
);
ProductCard.displayName = 'ProductCard';

// ─────────────────────────────────────────────────────────────────────────────
// ProductGrid2x2 — the SDUI component
// ─────────────────────────────────────────────────────────────────────────────

type Props = SDUIComponentProps<ProductGrid2x2Data>;

export const ProductGrid2x2: React.FC<Props> = React.memo(({ id, data, testID }) => {
  const { header, items, gutter = 8, cardTheme, theme: nodeThemeOverride } = data;

  // ── Theme ──────────────────────────────────────────────────────────────
  // ProductGrid2x2 itself only needs theme for container background + padding.
  // CardTheme is passed down to each ProductCard — resolved there, not here.
  const nodeTheme = useNodeTheme(nodeThemeOverride);
  const { theme } = useTheme();

  // dispatch is stable (ActionContext singleton) — safe in useCallback([])
  const dispatch = useActionDispatch();

  // ── FlashList callbacks — all stable, defined with [] deps ─────────────

  const renderItem = useCallback(
    ({ item }: { item: ProductGridItem }) => (
      // cardTheme is a stable object ref from the payload.
      // dispatch is a stable context ref.
      // Both are safe to close over without deps.
      <ProductCard item={item} cardTheme={cardTheme} dispatch={dispatch} />
    ),
    // cardTheme is server-supplied and stable; dispatch is context-stable.
    // If the server sends a different cardTheme, the node ref changes and
    // SDUINodeRenderer re-renders the whole component anyway.
    [cardTheme, dispatch],
  );

  const keyExtractor = useCallback(
    (item: ProductGridItem) => item.id,
    [],
  );

  /**
   * getItemType — tells FlashList to maintain two separate recycled view pools:
   *   'in_stock'     → full card with CTA button
   *   'out_of_stock' → shorter card with disabled button
   *
   * Without this, FlashList might recycle an in-stock cell layout into an
   * out-of-stock slot causing layout flicker.
   */
  const getItemType = useCallback(
    (item: ProductGridItem): string =>
      item.isOutOfStock ? ITEM_TYPE_OUT_OF_STOCK : ITEM_TYPE_IN_STOCK,
    [],
  );

  // Stable separator — uses useMemo to capture gutter without recreating
  // the component on each render. RowSeparator is a module-level component
  // so FlashList sees a stable reference.
  const ItemSeparator = useMemo(
    () => () => <RowSeparator height={gutter} />,
    [gutter],
  );

  // ── Header "See All" handler ───────────────────────────────────────────
  const handleSeeAll = useCallback(() => {
    if (data.header?.seeAllAction) {
      void dispatch(data.header.seeAllAction as AppAction);
    }
  }, [data.header?.seeAllAction, dispatch]);

  // ── Container styles driven by nodeTheme ──────────────────────────────
  const containerBg = nodeTheme.backgroundColor ?? theme.colors.bgSecondary;
  const containerPad = nodeTheme.padding;

  return (
    <View
      testID={testID ?? `product-grid-${id}`}
      style={[
        gridStyles.container,
        {
          backgroundColor: containerBg,
          opacity: nodeTheme.opacity ?? 1,
          paddingTop: containerPad?.top ?? 0,
          paddingRight: containerPad?.right ?? 0,
          paddingBottom: containerPad?.bottom ?? 16,
          paddingLeft: containerPad?.left ?? 0,
        },
      ]}
    >
      {/* Section header */}
      {header ? (
        <View style={gridStyles.header}>
          <View style={gridStyles.headerTextBlock}>
            <Text style={[gridStyles.headerTitle, { color: theme.colors.textPrimary }]}>
              {header.title}
            </Text>
            {header.subtitle ? (
              <Text style={[gridStyles.headerSubtitle, { color: theme.colors.textSecondary }]}>
                {header.subtitle}
              </Text>
            ) : null}
          </View>
          {header.seeAllAction ? (
            <TouchableOpacity onPress={handleSeeAll} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Text style={[gridStyles.seeAll, { color: theme.colors.brandPrimary }]}>
                {header.seeAllLabel ?? 'See All'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ) : null}

      {/* 2-column FlashList grid */}
      <FlashList
        data={items}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemType={getItemType}
        numColumns={2}
        estimatedItemSize={ESTIMATED_ITEM_SIZE}
        ItemSeparatorComponent={ItemSeparator}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        // Disable clipping — parent owns the scroll view
        removeClippedSubviews={false}
      />
    </View>
  );
});

ProductGrid2x2.displayName = 'ProductGrid2x2';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const gridStyles = StyleSheet.create({
  container: {
    marginVertical: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTextBlock: { flex: 1 },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
});

const cardStyles = StyleSheet.create({
  card: {
    flex: 1,
    margin: 4,
    overflow: 'hidden',
    // Elevation handled via theme.shadows passed as style
    ...Platform.select({
      ios: {},
      android: { elevation: 2 },
    }),
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
    backgroundColor: '#F5F5F5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  oosOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oosText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#757575',
    letterSpacing: 0.5,
  },
  badgeContainer: {
    position: 'absolute',
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wishlistIcon: {
    fontSize: 16,
    lineHeight: 18,
  },
  content: {
    flex: 1,
  },
  brand: {
    fontSize: 10,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    lineHeight: 18,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 3,
  },
  ratingStars: {
    fontSize: 10,
    color: '#FFA000',
    letterSpacing: 1,
  },
  ratingValue: {
    fontSize: 10,
    color: '#616161',
    fontWeight: '600',
  },
  reviewCount: {
    fontSize: 10,
    color: '#9E9E9E',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 8,
  },
  salePrice: {
    fontSize: 15,
    fontWeight: '800',
  },
  originalPrice: {
    fontSize: 11,
    textDecorationLine: 'line-through',
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  ctaButton: {
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaDisabled: {
    backgroundColor: '#F5F5F5',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
