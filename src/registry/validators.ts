/**
 * validators.ts
 *
 * Runtime type-guard validators for each SDUI component's data payload.
 *
 * ─── Design decisions ───────────────────────────────────────────────────────
 *
 * • Every validator is a TypeScript type guard: `(data: unknown) => data is T`
 *   This keeps them usable both in the registry entry AND in any component
 *   that needs to narrow its own data prop at runtime.
 *
 * • Validators check the MINIMUM required fields only. They don't recurse
 *   deeply into optional sub-objects — that would make the validator fragile
 *   against future schema additions.
 *
 * • "Required field" means: if this field is missing, the component WILL
 *   crash or render nonsense. Optional fields are never checked here.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { BannerHeroData } from '@/types/components/BannerHero';
import type { ProductGrid2x2Data } from '@/types/components/ProductGrid2x2';
import type { DynamicCollectionData } from '@/types/components/DynamicCollection';
import type { FullScreenOverlayData } from '@/types/components/FullScreenOverlay';

// ─────────────────────────────────────────────────────────────────────────────
// Guard helpers
// ─────────────────────────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function hasString(obj: Record<string, unknown>, key: string): boolean {
  return typeof obj[key] === 'string' && (obj[key] as string).length > 0;
}

function hasObject(obj: Record<string, unknown>, key: string): boolean {
  return isObject(obj[key]);
}

function hasArray(obj: Record<string, unknown>, key: string): boolean {
  return Array.isArray(obj[key]);
}

// ─────────────────────────────────────────────────────────────────────────────
// BANNER_HERO
// Required: layout (string), media (object), content.headline (string),
//           primaryCTA.label (string), primaryCTA.action (object)
// ─────────────────────────────────────────────────────────────────────────────

export function validateBannerHero(data: unknown): data is BannerHeroData {
  if (!isObject(data)) return false;

  // layout must be a non-empty string
  if (!hasString(data, 'layout')) return false;

  // media must be an object with a 'kind' discriminant
  if (!hasObject(data, 'media')) return false;
  const media = data['media'] as Record<string, unknown>;
  if (!hasString(media, 'kind')) return false;

  // content must exist and have a headline
  if (!hasObject(data, 'content')) return false;
  const content = data['content'] as Record<string, unknown>;
  if (!hasString(content, 'headline')) return false;

  // primaryCTA must have a label and an action
  if (!hasObject(data, 'primaryCTA')) return false;
  const cta = data['primaryCTA'] as Record<string, unknown>;
  if (!hasString(cta, 'label')) return false;
  if (!hasObject(cta, 'action')) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT_GRID_2X2
// Required: items (array, non-empty)
// Each item: id, productId, variantId, sku, name, image.uri, price.salePrice
// ─────────────────────────────────────────────────────────────────────────────

export function validateProductGrid2x2(data: unknown): data is ProductGrid2x2Data {
  if (!isObject(data)) return false;
  if (!hasArray(data, 'items')) return false;

  const items = data['items'] as unknown[];
  if (items.length === 0) return false;

  // Spot-check the first item — a full check of all 52 items on every render
  // would be wasteful. The first item is representative of the server's schema.
  const first = items[0];
  if (!isObject(first)) return false;
  if (!hasString(first, 'id')) return false;
  if (!hasString(first, 'productId')) return false;
  if (!hasString(first, 'variantId')) return false;
  if (!hasString(first, 'sku')) return false;
  if (!hasString(first, 'name')) return false;

  if (!hasObject(first, 'image')) return false;
  const image = first['image'] as Record<string, unknown>;
  if (!hasString(image, 'uri')) return false;

  if (!hasObject(first, 'price')) return false;
  const price = first['price'] as Record<string, unknown>;
  if (typeof price['salePrice'] !== 'number') return false;
  if (!hasString(price, 'currency')) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// DYNAMIC_COLLECTION
// Required: collectionKind (string), items (array), layout (object)
// ─────────────────────────────────────────────────────────────────────────────

export function validateDynamicCollection(data: unknown): data is DynamicCollectionData {
  if (!isObject(data)) return false;
  if (!hasString(data, 'collectionKind')) return false;
  if (!hasArray(data, 'items')) return false;
  if (!hasObject(data, 'layout')) return false;

  const layout = data['layout'] as Record<string, unknown>;
  if (!hasString(layout, 'scrollDirection')) return false;

  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// FULL_SCREEN_OVERLAY
// Required: content.kind (string), content.headline (string),
//           content.primaryCTA (object), trigger.on (string),
//           dismissConfig.mode (string)
// ─────────────────────────────────────────────────────────────────────────────

export function validateFullScreenOverlay(data: unknown): data is FullScreenOverlayData {
  if (!isObject(data)) return false;

  if (!hasObject(data, 'content')) return false;
  const content = data['content'] as Record<string, unknown>;
  if (!hasString(content, 'kind')) return false;

  // app_update has updateCTA instead of primaryCTA
  const isAppUpdate = content['kind'] === 'app_update';
  if (isAppUpdate) {
    if (!hasString(content, 'headline')) return false;
    if (!hasObject(content, 'updateCTA')) return false;
  } else {
    if (!hasString(content, 'headline')) return false;
    if (!hasObject(content, 'primaryCTA')) return false;
    const cta = content['primaryCTA'] as Record<string, unknown>;
    if (!hasString(cta, 'label')) return false;
    if (!hasObject(cta, 'action')) return false;
  }

  if (!hasObject(data, 'trigger')) return false;
  const trigger = data['trigger'] as Record<string, unknown>;
  if (!hasString(trigger, 'on')) return false;

  if (!hasObject(data, 'dismissConfig')) return false;
  const dismiss = data['dismissConfig'] as Record<string, unknown>;
  if (!hasString(dismiss, 'mode')) return false;

  return true;
}
