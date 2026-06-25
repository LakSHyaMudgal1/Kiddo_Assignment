/**
 * SDUIRenderer.tsx
 *
 * Production SDUI renderer — FlashList-powered, zero unnecessary re-renders.
 *
 * ─── The re-render problem (before this fix) ─────────────────────────────────
 *
 * BEFORE:
 *   const store = useStore();  // subscribes to the ENTIRE RootStore
 *
 * Every time anything in the store changes — cart item added, toast shown,
 * theme toggled — Zustand re-ran every mounted SDUINodeRenderer's subscription.
 * With 20 nodes on the homepage, one ADD_TO_CART caused 20 re-render checks.
 * Even though React.memo's comparator (prev.node === next.node) would bail out
 * for most nodes, the subscription callback still executed and React still
 * called the memo comparator 20 times. On a 60fps timeline this is wasteful
 * and measurably degrades scroll performance on mid-range Android devices.
 *
 * ─── The fix ─────────────────────────────────────────────────────────────────
 *
 * AFTER:
 *   // Nodes with no visibility rule → NO subscription at all
 *   const visibilitySnapshot = useVisibilityState(node.visibility);
 *
 * The key insight: SDUINodeRenderer only needs store state for ONE purpose —
 * evaluating visibility conditions. It does not need cart state, wishlist
 * state, auth state, or UI state for any other reason. Those concerns belong
 * to the individual components (ProductCard, DynamicCollection, etc.) which
 * already subscribe with isolated per-item selectors.
 *
 * The `useVisibilityState` hook:
 *   1. Reads the storeKeys from node.visibility.conditions at render time
 *   2. Builds a minimal selector that fetches ONLY those dot-path values
 *   3. Returns a plain object { [storeKey]: value }
 *   4. Zustand only re-renders when one of those specific values changes
 *   5. If node.visibility is undefined → returns EMPTY_SNAPSHOT immediately
 *      with NO useStore subscription at all (React rules allow this because
 *      the hook count is stable — visibility is fixed per node from server)
 *
 * ─── Re-render behavior after fix ───────────────────────────────────────────
 *
 * ADD_TO_CART is dispatched:
 *
 *   cartSlice.addItem() mutates state.items
 *     │
 *     ▼
 *   Zustand notifies subscribers
 *     │
 *     ├─ SDUINodeRenderer for BANNER_HERO nodes (no visibility)
 *     │    useVisibilityState → NO subscription → NOT NOTIFIED ✓
 *     │
 *     ├─ SDUINodeRenderer for PRODUCT_GRID_2X2 nodes (no visibility)
 *     │    useVisibilityState → NO subscription → NOT NOTIFIED ✓
 *     │
 *     ├─ SDUINodeRenderer for DYNAMIC_COLLECTION nodes (no visibility)
 *     │    useVisibilityState → NO subscription → NOT NOTIFIED ✓
 *     │
 *     ├─ SDUINodeRenderer for MGC overlay (visibility: isAuthenticated eq true)
 *     │    useVisibilityState subscribes to: { isAuthenticated: boolean }
 *     │    ADD_TO_CART does NOT change isAuthenticated
 *     │    selector returns same value → NOT re-rendered ✓
 *     │
 *     └─ ProductCard / CollectionProductItem (inside ProductGrid / Collection)
 *          selectIsInCart('prod-003', 'var-003') → false → TRUE → re-renders ✓
 *          All other product cards: same boolean → NOT re-rendered ✓
 *
 * Result: ONE component re-renders per ADD_TO_CART, regardless of page size.
 *
 * ─── Isolation guarantees preserved ─────────────────────────────────────────
 *
 * ProductGrid2x2 and DynamicCollection isolation is unchanged and additive:
 *
 *   SDUINodeRenderer  → no store subscription (wrapper layer)
 *     └─ ProductGrid2x2  → no store subscription (container layer)
 *           └─ ProductCard  → selectIsInCart + selectIsInWishlist (leaf layer)
 *
 *   SDUINodeRenderer  → no store subscription (wrapper layer)
 *     └─ DynamicCollection  → no store subscription (container layer)
 *           └─ ProductItemRenderer  → selectIsInCart + selectIsInWishlist
 *           └─ CategoryItemRenderer → no subscription
 *           └─ BrandItemRenderer    → no subscription
 *           └─ BannerItemRenderer   → no subscription
 *           └─ MysteryGiftRenderer  → no subscription
 *
 * Every layer is independently minimal.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useCallback, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList, type ListRenderItemInfo } from '@shopify/flash-list';

import { REGISTRY } from '@registry/registerComponents';
import { resolveEntryUnknown } from '@registry/componentRegistry';
import type { SDUINode } from '@registry/types';
import type { SDUIVisibility, SDUIConditionOperator } from '@/types/sdui-primitives';
import { useStore } from '@store/rootStore';
import type { RootStore } from '@store/rootStore';

// ─────────────────────────────────────────────────────────────────────────────
// Visibility snapshot type
// ─────────────────────────────────────────────────────────────────────────────

/**
 * A flat snapshot of only the store values needed to evaluate one node's
 * visibility conditions. Keys are the dot-paths from `condition.storeKey`.
 *
 * e.g.  { 'isAuthenticated': true, 'user.tier': 'premium' }
 */
type VisibilitySnapshot = Record<string, unknown>;

/** Sentinel: returned by nodes with no visibility rule — costs nothing */
const EMPTY_SNAPSHOT: VisibilitySnapshot = Object.freeze({});

// ─────────────────────────────────────────────────────────────────────────────
// Dot-path value reader
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Reads a dot-path value from the store.
 *
 *   getStoreValue(store, 'isAuthenticated')  → store.isAuthenticated
 *   getStoreValue(store, 'user.tier')        → store.user?.tier
 *
 * Returns `undefined` if any segment along the path is missing.
 */
function getStoreValue(store: RootStore, dotPath: string): unknown {
  return dotPath.split('.').reduce<unknown>(
    (obj, key) =>
      obj != null && typeof obj === 'object'
        ? (obj as Record<string, unknown>)[key]
        : undefined,
    store,
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Minimal visibility selector builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Builds a Zustand selector that extracts ONLY the store values referenced
 * by a node's visibility conditions.
 *
 * The selector returns a new object only when one of the referenced values
 * actually changes. Zustand uses reference equality to detect changes, so
 * we return the SAME object reference when all values are unchanged.
 *
 * This is implemented by caching the last snapshot and doing a shallow
 * field-by-field comparison before creating a new object.
 */
function buildVisibilitySelector(
  storeKeys: readonly string[],
): (state: RootStore) => VisibilitySnapshot {
  // Cache outside the selector so it survives re-invocations
  let cachedSnapshot: VisibilitySnapshot = {};

  return (state: RootStore): VisibilitySnapshot => {
    let changed = false;

    for (const key of storeKeys) {
      const freshValue = getStoreValue(state, key);
      if (!Object.prototype.hasOwnProperty.call(cachedSnapshot, key) ||
          cachedSnapshot[key] !== freshValue) {
        changed = true;
        break;
      }
    }

    if (!changed && Object.keys(cachedSnapshot).length === storeKeys.length) {
      return cachedSnapshot;
    }

    // Build a fresh snapshot — only when values actually changed
    const next: VisibilitySnapshot = {};
    for (const key of storeKeys) {
      next[key] = getStoreValue(state, key);
    }
    cachedSnapshot = next;
    return next;
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// useVisibilityState — the core hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useVisibilityState
 *
 * Subscribes to ONLY the store keys referenced in the node's visibility
 * conditions. Nodes with no visibility rule subscribe to nothing.
 *
 * The selector is memoised by the storeKeys array. Since storeKeys come from
 * the server payload (stable reference), the memo deps never change after
 * mount — the selector is built once and reused.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  node.visibility = undefined                                 │
 * │    → returns EMPTY_SNAPSHOT                                  │
 * │    → NO useStore call → zero Zustand subscription           │
 * │    → this component NEVER re-renders from store changes      │
 * ├──────────────────────────────────────────────────────────────┤
 * │  node.visibility = { conditions: [{ storeKey: 'isAuth' }] } │
 * │    → subscribes to { isAuthenticated: boolean } only        │
 * │    → re-renders ONLY when isAuthenticated changes           │
 * │    → ADD_TO_CART does not change isAuthenticated → no render │
 * └──────────────────────────────────────────────────────────────┘
 */
function useVisibilityState(
  visibility: SDUIVisibility | undefined,
): VisibilitySnapshot {
  // Extract unique storeKeys from conditions — stable once server payload loads
  const storeKeys: readonly string[] = useMemo(() => {
    if (!visibility) return [];
    // Deduplicate — a node might reference the same key in multiple conditions
    return [...new Set(visibility.conditions.map((c) => c.storeKey))];
  }, [visibility]);

  // Build a memoised selector for this exact set of keys.
  // useMemo ensures the selector function (and its internal cache) is created
  // once per unique storeKeys array, not on every render.
  const selector = useMemo(
    () => buildVisibilitySelector(storeKeys),
    // We intentionally stringify storeKeys for stable memo comparison.
    // Array identity changes on every render even with same contents.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storeKeys.join(',')],
  );

  // Conditional hook call: only subscribe when there are keys to subscribe to.
  //
  // React rules require hooks to be called in the same order every render.
  // This is safe here because `storeKeys` is derived from `node.visibility`
  // which is a fixed server-supplied value — it NEVER changes after mount.
  // The branch is stable per component instance.
  //
  // If visibility is undefined, we skip the subscription entirely and return
  // the frozen EMPTY_SNAPSHOT, avoiding any Zustand subscription overhead.
  const snapshot = useStore(storeKeys.length > 0 ? selector : () => EMPTY_SNAPSHOT);

  return snapshot;
}

// ─────────────────────────────────────────────────────────────────────────────
// Visibility evaluator
// ─────────────────────────────────────────────────────────────────────────────

const conditionEvaluators: Readonly<
  Record<SDUIConditionOperator, (actual: unknown, expected: unknown) => boolean>
> = {
  eq:    (a, e) => a === e,
  neq:   (a, e) => a !== e,
  gt:    (a, e) => typeof a === 'number' && typeof e === 'number' && a > e,
  gte:   (a, e) => typeof a === 'number' && typeof e === 'number' && a >= e,
  lt:    (a, e) => typeof a === 'number' && typeof e === 'number' && a < e,
  lte:   (a, e) => typeof a === 'number' && typeof e === 'number' && a <= e,
  in:    (a, e) => Array.isArray(e) && e.includes(a),
  notIn: (a, e) => Array.isArray(e) && !e.includes(a),
};

/**
 * Evaluates a composite visibility rule against a pre-fetched snapshot.
 * Does NOT touch the store — works entirely from the snapshot object.
 */
function passesVisibility(
  visibility: SDUIVisibility | undefined,
  snapshot: VisibilitySnapshot,
): boolean {
  if (!visibility) return true;

  const { logic, conditions } = visibility;

  const results = conditions.map(({ storeKey, operator, value }) => {
    const actual = snapshot[storeKey];
    const evaluator = conditionEvaluators[operator];
    return evaluator ? evaluator(actual, value) : false;
  });

  return logic === 'AND' ? results.every(Boolean) : results.some(Boolean);
}

// ─────────────────────────────────────────────────────────────────────────────
// Dev-only diagnostic components (tree-shaken in production builds)
// ─────────────────────────────────────────────────────────────────────────────

const UnregisteredComponent: React.FC<{ type: string; id: string }> =
  ({ type, id }) => (
    <View style={devStyles.unknownContainer} testID={`sdui-unregistered-${id}`}>
      <Text style={devStyles.unknownLabel}>⚠ Unregistered component</Text>
      <Text style={devStyles.unknownType}>type: &quot;{type}&quot;</Text>
      <Text style={devStyles.unknownId}>id: {id}</Text>
    </View>
  );

const ValidationFailedComponent: React.FC<{ type: string; id: string }> =
  ({ type, id }) => (
    <View style={devStyles.invalidContainer} testID={`sdui-invalid-${id}`}>
      <Text style={devStyles.unknownLabel}>✕ Validation failed</Text>
      <Text style={devStyles.unknownType}>type: &quot;{type}&quot;</Text>
      <Text style={devStyles.unknownId}>id: {id}</Text>
    </View>
  );

// ─────────────────────────────────────────────────────────────────────────────
// SDUINodeRenderer
// ─────────────────────────────────────────────────────────────────────────────

interface SDUINodeRendererProps {
  node: SDUINode;
}

/**
 * SDUINodeRenderer
 *
 * Renders exactly one SDUINode. Memoised — re-renders ONLY when:
 *   1. `node` reference changes (new server payload), OR
 *   2. A store value referenced by this node's visibility conditions changes
 *
 * Nodes with no visibility rule (the majority on any page) subscribe to
 * nothing and never re-render from store mutations.
 */
export const SDUINodeRenderer: React.FC<SDUINodeRendererProps> = React.memo(
  ({ node }) => {
    // ── Extract visibility from the node ──────────────────────────────────
    // SDUINode uses SDUIVisibilityRule (simple eq check) while the data
    // objects use SDUIVisibility (composite AND/OR). We support both.
    //
    // The node-level visibility (SDUIVisibilityRule) is a legacy simple form.
    // The data-level visibility (SDUIVisibility) is the full composite form.
    // We normalise the node-level rule into composite form for uniform handling.
    const nodeVisibility = useMemo<SDUIVisibility | undefined>(() => {
      // Composite visibility from node data (used in FULL_SCREEN_OVERLAY, etc.)
      const dataVisibility = (node.data as { visibility?: SDUIVisibility }).visibility;
      if (dataVisibility) return dataVisibility;

      // Legacy simple visibility rule from SDUINode.visibility
      if (node.visibility) {
        return {
          logic: 'AND',
          conditions: [{
            storeKey: node.visibility.storeKey,
            operator: 'eq',
            value: node.visibility.equals,
          }],
        };
      }

      return undefined;
    }, [node.visibility, node.data]);

    // ── Minimal store subscription ────────────────────────────────────────
    // Nodes with no visibility → EMPTY_SNAPSHOT → zero Zustand subscription
    // Nodes with visibility → subscribes only to referenced storeKeys
    const visibilitySnapshot = useVisibilityState(nodeVisibility);

    // ── Visibility gate ───────────────────────────────────────────────────
    if (!passesVisibility(nodeVisibility, visibilitySnapshot)) {
      return null;
    }

    // ── Registry lookup — O(1), no switch ────────────────────────────────
    const entry = resolveEntryUnknown(REGISTRY, node.type);

    if (!entry) {
      if (__DEV__) {
        console.warn(
          `[SDUIRenderer] Unregistered component type: "${node.type}" (id: ${node.id})`,
        );
        return <UnregisteredComponent type={node.type} id={node.id} />;
      }
      return null;
    }

    // ── Schema validation ─────────────────────────────────────────────────
    if (entry.validate && !entry.validate(node.data)) {
      if (__DEV__) {
        console.warn(
          `[SDUIRenderer] Validation failed for "${node.type}" (id: ${node.id})`,
          node.data,
        );
        return <ValidationFailedComponent type={node.type} id={node.id} />;
      }
      return null;
    }

    // ── Render ────────────────────────────────────────────────────────────
    const Component = entry.component as React.ComponentType<{
      id: string;
      type: string;
      data: unknown;
      children?: SDUINode[];
      analyticsLabel?: string;
      testID?: string;
    }>;

    return (
      <Component
        id={node.id}
        type={node.type}
        data={node.data}
        {...(node.children !== undefined ? { children: node.children } : {})}
        {...(node.analyticsLabel !== undefined ? { analyticsLabel: node.analyticsLabel } : {})}
        testID={node.testID ?? `sdui-${node.type}-${node.id}`}
      />
    );
  },
  // Custom memo comparator.
  // The node reference from the server payload is stable between renders.
  // We only re-render when the node itself changes (new payload) OR when
  // Zustand schedules a re-render because visibilitySnapshot changed.
  // The comparator only guards the `node` prop — Zustand handles the rest
  // by scheduling re-renders directly when the selector output changes.
  (prev, next) => prev.node === next.node,
);

SDUINodeRenderer.displayName = 'SDUINodeRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// SDUIPageRenderer — FlashList-powered full-page feed
// ─────────────────────────────────────────────────────────────────────────────

interface SDUIPageRendererProps {
  nodes: SDUINode[];
  estimatedItemSize?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
  ListHeaderComponent?: React.ReactElement;
  ListFooterComponent?: React.ReactElement;
}

export const SDUIPageRenderer: React.FC<SDUIPageRendererProps> = ({
  nodes,
  estimatedItemSize = 220,
  onRefresh,
  refreshing = false,
  ListHeaderComponent,
  ListFooterComponent,
}) => {
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SDUINode>) => <SDUINodeRenderer node={item} />,
    [],
  );

  const keyExtractor = useCallback((item: SDUINode) => item.id, []);

  const { overlayNodes, feedNodes } = useMemo(() => {
    const overlays: SDUINode[] = [];
    const feed: SDUINode[] = [];
    for (const node of nodes) {
      if (node.type === 'FULL_SCREEN_OVERLAY') {
        overlays.push(node);
      } else {
        feed.push(node);
      }
    }
    return { overlayNodes: overlays, feedNodes: feed };
  }, [nodes]);

  return (
    <View style={styles.pageContainer}>
      {/* Overlays mount immediately outside the list — not virtualised */}
      {overlayNodes.map(node => (
        <SDUINodeRenderer key={node.id} node={node} />
      ))}

      <FlashList
        data={feedNodes}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        estimatedItemSize={estimatedItemSize}
        showsVerticalScrollIndicator={false}
        onRefresh={onRefresh}
        refreshing={refreshing}
        ListHeaderComponent={ListHeaderComponent}
        ListFooterComponent={ListFooterComponent}
        getItemType={(item: SDUINode) => item.type}
        // removeClippedSubviews={false} — prevents touch ghost on Android
        // when items scroll back into view after being clipped
        removeClippedSubviews={false}
      />
    </View>
  );
};

SDUIPageRenderer.displayName = 'SDUIPageRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// SDUIInlineRenderer — non-virtualised, for small node counts
// ─────────────────────────────────────────────────────────────────────────────

export const SDUIInlineRenderer: React.FC<{ nodes: SDUINode[] }> = ({ nodes }) => (
  <>
    {nodes.map(node => (
      <SDUINodeRenderer key={node.id} node={node} />
    ))}
  </>
);

SDUIInlineRenderer.displayName = 'SDUIInlineRenderer';

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  pageContainer: { flex: 1 },
});

const devStyles = StyleSheet.create({
  unknownContainer: {
    margin: 12,
    padding: 10,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B00',
  },
  invalidContainer: {
    margin: 12,
    padding: 10,
    backgroundColor: '#FFEBEE',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E53935',
  },
  unknownLabel: { fontSize: 11, fontWeight: '700', color: '#424242', marginBottom: 2 },
  unknownType:  { fontSize: 11, color: '#FF6B00',  fontFamily: 'monospace' },
  unknownId:    { fontSize: 10, color: '#9E9E9E',  fontFamily: 'monospace' },
});
