/**
 * Design token: Color palette
 * Raw color values only — no semantic meaning here.
 * Semantic aliases live in semanticColors.ts
 */
export const palette = {
  // Brand
  brand50: '#FFF3E0',
  brand100: '#FFE0B2',
  brand200: '#FFCC80',
  brand300: '#FFB74D',
  brand400: '#FFA726',
  brand500: '#FF9800',
  brand600: '#FB8C00',
  brand700: '#F57C00',
  brand800: '#EF6C00',
  brand900: '#E65100',

  // Neutral
  neutral0: '#FFFFFF',
  neutral50: '#FAFAFA',
  neutral100: '#F5F5F5',
  neutral200: '#EEEEEE',
  neutral300: '#E0E0E0',
  neutral400: '#BDBDBD',
  neutral500: '#9E9E9E',
  neutral600: '#757575',
  neutral700: '#616161',
  neutral800: '#424242',
  neutral900: '#212121',
  neutral1000: '#000000',

  // Semantic
  success50: '#E8F5E9',
  success500: '#4CAF50',
  success700: '#388E3C',

  warning50: '#FFFDE7',
  warning500: '#FFC107',
  warning700: '#FFA000',

  error50: '#FFEBEE',
  error500: '#F44336',
  error700: '#D32F2F',

  info50: '#E3F2FD',
  info500: '#2196F3',
  info700: '#1976D2',

  // Transparent
  transparent: 'transparent',
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.2)',
} as const;

export type PaletteKey = keyof typeof palette;
