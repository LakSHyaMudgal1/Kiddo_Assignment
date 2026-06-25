import { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { useTheme } from '@context/ThemeContext';
import type { AppTheme } from '@theme/theme';

/**
 * Hook for creating theme-aware StyleSheets.
 * Re-computes only when the theme changes.
 *
 * @example
 *   const styles = useThemeStyles((theme) =>
 *     StyleSheet.create({
 *       container: { backgroundColor: theme.colors.bgPrimary },
 *     })
 *   );
 */
export const useThemeStyles = <T extends StyleSheet.NamedStyles<T>>(
  factory: (theme: AppTheme) => T,
): T => {
  const { theme } = useTheme();
  return useMemo(() => factory(theme), [theme, factory]);
};
