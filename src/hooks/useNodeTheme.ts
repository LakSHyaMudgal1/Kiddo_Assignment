/**
 * useNodeTheme.ts
 *
 * Merges a server-supplied SDUIThemeOverride with the active AppTheme
 * to produce resolved style values a component can use directly.
 *
 * ─── Why this exists ────────────────────────────────────────────────────────
 *
 * The server sends colors as SDUIColor, which can be:
 *   - A SemanticColorKey  →  must be resolved through the active theme
 *   - A hex string        →  used as-is
 *   - An rgba string      →  used as-is
 *
 * Components must never hardcode colors. This hook is the single point
 * where SDUIColor → real color string resolution happens.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react';
import { useTheme } from '@context/ThemeContext';
import type { AppTheme } from '@theme/theme';
import type { SemanticColorKey } from '@theme/semanticColors';
import type {
  SDUIColor,
  SDUIBackground,
  SDUIInsets,
} from '@/types/sdui-primitives';
import type { SDUIThemeOverride, SDUICardTheme } from '@/types/sdui-theme';

// ─────────────────────────────────────────────────────────────────────────────
// Color resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves an SDUIColor to a concrete color string.
 *
 * SemanticColorKey  → theme.colors[key]
 * '#...' / 'rgba(…' → returned as-is (raw server override)
 */
export function resolveColor(
  color: SDUIColor | undefined,
  theme: AppTheme,
): string | undefined {
  if (!color) return undefined;
  // Raw hex or rgba — pass through
  if (color.startsWith('#') || color.startsWith('rgba(')) return color;
  // Semantic key — look up in active theme
  const semanticKey = color as SemanticColorKey;
  return theme.colors[semanticKey] ?? undefined;
}

// ─────────────────────────────────────────────────────────────────────────────
// Background resolver
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Resolves an SDUIBackground to a concrete backgroundColor string.
 * Gradients are not natively supported by RN View — only the first stop
 * is used as a fallback unless a gradient library is in use.
 */
export function resolveBackground(
  bg: SDUIBackground | undefined,
  theme: AppTheme,
): string | undefined {
  if (!bg) return undefined;
  if (bg.kind === 'solid') return resolveColor(bg.color, theme);
  if (bg.kind === 'gradient') {
    // Return first stop color as a solid fallback.
    // Replace with LinearGradient when expo-linear-gradient is wired up.
    const firstStop = bg.gradient.stops[0];
    return resolveColor(firstStop.color, theme);
  }
  return undefined; // 'transparent'
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolved shape — what components consume
// ─────────────────────────────────────────────────────────────────────────────

export interface ResolvedNodeTheme {
  backgroundColor: string | undefined;
  foregroundColor: string | undefined;
  accentColor: string | undefined;
  borderColor: string | undefined;
  borderWidth: number | undefined;
  borderRadius: number | undefined;
  elevation: number | undefined;
  opacity: number | undefined;
  padding: SDUIInsets | undefined;
}

export interface ResolvedCardTheme {
  backgroundColor: string | undefined;
  borderColor: string | undefined;
  borderRadius: number | undefined;
  elevation: number | undefined;
  imageAspectRatio: number | undefined;
  contentPadding: SDUIInsets | undefined;
  bordered: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hooks
// ─────────────────────────────────────────────────────────────────────────────

/**
 * useNodeTheme
 *
 * Merges a component-level SDUIThemeOverride with the active AppTheme.
 * Re-computes only when the theme or override object reference changes.
 *
 * @example
 *   const nodeTheme = useNodeTheme(data.theme);
 *   <View style={{ backgroundColor: nodeTheme.backgroundColor }} />
 */
export function useNodeTheme(
  override: SDUIThemeOverride | undefined,
): ResolvedNodeTheme {
  const { theme } = useTheme();

  return useMemo<ResolvedNodeTheme>(() => {
    const bg = override?.background
      ? resolveBackground(override.background, theme)
      : theme.colors.surfaceDefault;

    return {
      backgroundColor: bg,
      foregroundColor: resolveColor(override?.foregroundColor, theme),
      accentColor: resolveColor(override?.accentColor, theme) ?? theme.colors.brandPrimary,
      borderColor: resolveColor(override?.border?.color, theme),
      borderWidth: override?.border?.width,
      borderRadius: override?.borderRadius,
      elevation: override?.elevation,
      opacity: override?.opacity,
      padding: override?.padding,
    };
  }, [theme, override]);
}

/**
 * useCardTheme
 *
 * Resolves an SDUICardTheme against the active AppTheme.
 * Used by ProductCard and DynamicCollection item renderers.
 */
export function useCardTheme(
  cardTheme: SDUICardTheme | undefined,
): ResolvedCardTheme {
  const { theme } = useTheme();

  return useMemo<ResolvedCardTheme>(() => ({
    backgroundColor: cardTheme?.background
      ? resolveColor(cardTheme.background, theme)
      : theme.colors.surfaceDefault,
    borderColor: cardTheme?.borderColor
      ? resolveColor(cardTheme.borderColor, theme)
      : theme.colors.borderDefault,
    borderRadius: cardTheme?.borderRadius ?? theme.radii.md,
    elevation: cardTheme?.elevation ?? 1,
    imageAspectRatio: cardTheme?.imageAspectRatio ?? 1,
    contentPadding: cardTheme?.contentPadding,
    bordered: cardTheme?.bordered ?? false,
  }), [theme, cardTheme]);
}
