/**
 * componentRegistry.ts
 *
 * Factory-pattern SDUI component registry.
 *
 * ─── Design decisions ───────────────────────────────────────────────────────
 *
 * 1. PLAIN OBJECT, NOT A CLASS
 *    The registry is a plain Record<TypedComponentKey, RegistryEntry>.
 *    It is created once at module init and never mutated at runtime.
 *    Components are resolved by direct property lookup — O(1), no Map
 *    overhead, no this-binding issues.
 *
 * 2. NO SWITCH STATEMENTS
 *    Resolution is a single index: registry[node.type].
 *    Adding a new component is one line in the registry object —
 *    no switch case to update, no if-else chain to extend.
 *
 * 3. TYPE-SAFE ENTRY SHAPE
 *    Each entry is typed as RegistryEntry<SDUIDataMap[K]> so the
 *    validator receives the correct data type — no `any`, no casting.
 *
 * 4. A/B SWAPPING
 *    createRegistry() accepts an override map. Swap a component for an
 *    experiment variant by passing overrides — the base registry is
 *    immutable, overrides are merged shallowly on top.
 *
 * 5. LAZY / FUTURE KEYS
 *    Keys not present in the registry (e.g. "NEW_COMPONENT_V2") return
 *    undefined. The renderer handles that gracefully — log + null, no throw.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { ComponentType } from 'react';
import type { SDUIDataMap, TypedComponentKey } from '@/types/components';
import type { SDUIBaseProps } from './types';
import type { SDUINode } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// Entry shape
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Props every SDUI component receives from the renderer.
 * Typed against the component's specific data interface.
 */
export type SDUIComponentProps<TData> = SDUIBaseProps & {
  data: TData;
  children?: SDUINode[];
};

/**
 * A typed registry entry for a specific component key K.
 */
export interface TypedRegistryEntry<K extends TypedComponentKey> {
  /** The React component that renders this node type */
  component: ComponentType<SDUIComponentProps<SDUIDataMap[K]>>;

  /**
   * Runtime data validator.
   * Called with node.data before the component is rendered.
   * Return false → skip the node and log a warning.
   * If omitted, the node always passes validation.
   */
  validate?: (data: unknown) => data is SDUIDataMap[K];

  /**
   * Fallback component shown while the real one lazy-loads.
   * Used with React.lazy — optional.
   */
  fallback?: ComponentType;
}

/**
 * The full registry type — every typed key maps to its entry.
 */
export type SDUIComponentRegistry = {
  readonly [K in TypedComponentKey]?: TypedRegistryEntry<K>;
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry factory
// ─────────────────────────────────────────────────────────────────────────────

/**
 * createRegistry
 *
 * Produces a frozen registry object from a base definition and optional
 * overrides (used for A/B experiments).
 *
 * Usage:
 *   const registry = createRegistry(baseComponents, experimentOverrides);
 *   const entry = registry['BANNER_HERO']; // TypedRegistryEntry<'BANNER_HERO'>
 */
export function createRegistry(
  base: SDUIComponentRegistry,
  overrides: SDUIComponentRegistry = {},
): Readonly<SDUIComponentRegistry> {
  return Object.freeze({ ...base, ...overrides });
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed resolver — the only public access point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * resolveEntry
 *
 * Type-safe O(1) lookup.
 * Returns `undefined` for any key not present in the registry —
 * including unknown types from future server versions.
 *
 * The return type preserves K so callers know exactly which data
 * type the component expects.
 */
export function resolveEntry<K extends TypedComponentKey>(
  registry: Readonly<SDUIComponentRegistry>,
  key: K,
): TypedRegistryEntry<K> | undefined {
  return registry[key] as TypedRegistryEntry<K> | undefined;
}

/**
 * resolveEntryUnknown
 *
 * Like resolveEntry but accepts an arbitrary string key (as received
 * from the server payload). Returns undefined for any non-registered
 * or non-typed key, without TypeScript complaining.
 */
export function resolveEntryUnknown(
  registry: Readonly<SDUIComponentRegistry>,
  key: string,
): TypedRegistryEntry<TypedComponentKey> | undefined {
  const entry = (registry as Record<string, unknown>)[key];
  return entry as TypedRegistryEntry<TypedComponentKey> | undefined;
}
