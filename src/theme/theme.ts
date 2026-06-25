import { lightSemanticColors, darkSemanticColors, type SemanticColors } from './semanticColors';
import { spacing, type SpacingKey } from './tokens/spacing';
import { radii, type RadiiKey } from './tokens/radii';
import { shadows, type ShadowKey } from './tokens/shadows';
import { fontFamily, fontSize, lineHeight, letterSpacing } from './tokens/typography';

/**
 * Full theme object — composed from tokens + semantic layers.
 * This is the single shape passed through ThemeContext.
 */
export interface AppTheme {
  colors: SemanticColors;
  spacing: typeof spacing;
  radii: typeof radii;
  shadows: typeof shadows;
  typography: {
    fontFamily: typeof fontFamily;
    fontSize: typeof fontSize;
    lineHeight: typeof lineHeight;
    letterSpacing: typeof letterSpacing;
  };
  isDark: boolean;
}

const baseTheme = {
  spacing,
  radii,
  shadows,
  typography: {
    fontFamily,
    fontSize,
    lineHeight,
    letterSpacing,
  },
} as const;

export const lightTheme: AppTheme = {
  ...baseTheme,
  colors: lightSemanticColors,
  isDark: false,
};

export const darkTheme: AppTheme = {
  ...baseTheme,
  colors: darkSemanticColors,
  isDark: true,
};

// Re-export keys for convenience
export type { SpacingKey, RadiiKey, ShadowKey };
