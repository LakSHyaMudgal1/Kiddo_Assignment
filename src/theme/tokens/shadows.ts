import { Platform } from 'react-native';

/**
 * Design token: Shadows (cross-platform)
 */
const shadow = (
  elevation: number,
  color: string = '#000',
  opacity: number = 0.15,
  radius: number = elevation * 2,
  offsetY: number = elevation,
) =>
  Platform.select({
    ios: {
      shadowColor: color,
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: {
      elevation,
    },
    default: {},
  });

export const shadows = {
  none: {},
  xs: shadow(1, '#000', 0.1, 2, 1),
  sm: shadow(2, '#000', 0.12, 4, 2),
  md: shadow(4, '#000', 0.14, 6, 4),
  lg: shadow(8, '#000', 0.16, 10, 6),
  xl: shadow(12, '#000', 0.18, 14, 8),
  '2xl': shadow(20, '#000', 0.2, 20, 12),
} as const;

export type ShadowKey = keyof typeof shadows;
