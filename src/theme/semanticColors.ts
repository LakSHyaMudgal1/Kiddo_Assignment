import { palette } from './tokens/colors';

// ─── SemanticColors shape ─────────────────────────────────────────────────────
// Defined first so both light and dark objects can be typed against it.
// Each value is `string` — palette tokens are hex/rgba strings at runtime.
export interface SemanticColors {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgInverse: string;
  bgOverlay: string;
  surfaceDefault: string;
  surfaceRaised: string;
  surfaceOverlay: string;
  surfaceSunken: string;
  brandPrimary: string;
  brandSecondary: string;
  brandOnPrimary: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  textOnBrand: string;
  textLink: string;
  borderDefault: string;
  borderStrong: string;
  borderFocus: string;
  successDefault: string;
  successSubtle: string;
  warningDefault: string;
  warningSubtle: string;
  errorDefault: string;
  errorSubtle: string;
  infoDefault: string;
  infoSubtle: string;
  interactivePrimary: string;
  interactivePrimaryHover: string;
  interactivePrimaryDisabled: string;
  interactiveSecondary: string;
  interactiveDestructive: string;
  iconPrimary: string;
  iconSecondary: string;
  iconInverse: string;
  iconBrand: string;
}

export type SemanticColorKey = keyof SemanticColors;

// ─── Light theme ──────────────────────────────────────────────────────────────
export const lightSemanticColors: SemanticColors = {
  bgPrimary: palette.neutral0,
  bgSecondary: palette.neutral50,
  bgTertiary: palette.neutral100,
  bgInverse: palette.neutral900,
  bgOverlay: palette.overlay,
  surfaceDefault: palette.neutral0,
  surfaceRaised: palette.neutral0,
  surfaceOverlay: palette.neutral0,
  surfaceSunken: palette.neutral100,
  brandPrimary: palette.brand500,
  brandSecondary: palette.brand100,
  brandOnPrimary: palette.neutral0,
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral600,
  textTertiary: palette.neutral500,
  textDisabled: palette.neutral400,
  textInverse: palette.neutral0,
  textOnBrand: palette.neutral0,
  textLink: palette.brand600,
  borderDefault: palette.neutral200,
  borderStrong: palette.neutral400,
  borderFocus: palette.brand500,
  successDefault: palette.success500,
  successSubtle: palette.success50,
  warningDefault: palette.warning500,
  warningSubtle: palette.warning50,
  errorDefault: palette.error500,
  errorSubtle: palette.error50,
  infoDefault: palette.info500,
  infoSubtle: palette.info50,
  interactivePrimary: palette.brand500,
  interactivePrimaryHover: palette.brand600,
  interactivePrimaryDisabled: palette.neutral300,
  interactiveSecondary: palette.neutral200,
  interactiveDestructive: palette.error500,
  iconPrimary: palette.neutral800,
  iconSecondary: palette.neutral500,
  iconInverse: palette.neutral0,
  iconBrand: palette.brand500,
};

// ─── Dark theme ───────────────────────────────────────────────────────────────
export const darkSemanticColors: SemanticColors = {
  bgPrimary: palette.neutral900,
  bgSecondary: palette.neutral800,
  bgTertiary: palette.neutral700,
  bgInverse: palette.neutral0,
  bgOverlay: palette.overlay,
  surfaceDefault: palette.neutral800,
  surfaceRaised: palette.neutral700,
  surfaceOverlay: palette.neutral800,
  surfaceSunken: palette.neutral900,
  brandPrimary: palette.brand400,
  brandSecondary: palette.brand900,
  brandOnPrimary: palette.neutral0,
  textPrimary: palette.neutral0,
  textSecondary: palette.neutral300,
  textTertiary: palette.neutral400,
  textDisabled: palette.neutral600,
  textInverse: palette.neutral900,
  textOnBrand: palette.neutral0,
  textLink: palette.brand300,
  borderDefault: palette.neutral700,
  borderStrong: palette.neutral500,
  borderFocus: palette.brand400,
  successDefault: palette.success500,
  successSubtle: palette.success700,
  warningDefault: palette.warning500,
  warningSubtle: palette.warning700,
  errorDefault: palette.error500,
  errorSubtle: palette.error700,
  infoDefault: palette.info500,
  infoSubtle: palette.info700,
  interactivePrimary: palette.brand400,
  interactivePrimaryHover: palette.brand500,
  interactivePrimaryDisabled: palette.neutral700,
  interactiveSecondary: palette.neutral700,
  interactiveDestructive: palette.error500,
  iconPrimary: palette.neutral100,
  iconSecondary: palette.neutral400,
  iconInverse: palette.neutral900,
  iconBrand: palette.brand400,
};
