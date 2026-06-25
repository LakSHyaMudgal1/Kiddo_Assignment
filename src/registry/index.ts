// ─── New production registry ──────────────────────────────────────────────────
export { REGISTRY, getActiveRegistry, registerAllComponents } from './registerComponents';
export { createRegistry, resolveEntry, resolveEntryUnknown } from './componentRegistry';
export type {
  SDUIComponentRegistry,
  TypedRegistryEntry,
  SDUIComponentProps,
} from './componentRegistry';

// ─── Base types ───────────────────────────────────────────────────────────────
export type {
  ComponentTypeKey,
  SDUINode,
  SDUIAction,
  SDUIBaseProps,
  SDUIVisibilityRule,
  RegistryEntry,
} from './types';

// ─── Validators (re-exported for testing) ────────────────────────────────────
export {
  validateBannerHero,
  validateProductGrid2x2,
  validateDynamicCollection,
  validateFullScreenOverlay,
} from './validators';
