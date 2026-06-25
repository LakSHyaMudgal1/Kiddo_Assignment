import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { lightTheme, darkTheme, type AppTheme } from '@theme/theme';
import { useStore } from '@store/rootStore';
import { selectThemeMode } from '@store/selectors/uiSelectors';

interface ThemeContextValue {
  theme: AppTheme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const systemScheme = useColorScheme();
  const themeMode = useStore(selectThemeMode);
  const setThemeMode = useStore((s) => s.setThemeMode);

  const theme = useMemo<AppTheme>(() => {
    if (themeMode === 'system') {
      return systemScheme === 'dark' ? darkTheme : lightTheme;
    }
    return themeMode === 'dark' ? darkTheme : lightTheme;
  }, [themeMode, systemScheme]);

  const toggleTheme = () => {
    setThemeMode(theme.isDark ? 'light' : 'dark');
  };

  const value = useMemo(
    () => ({ theme, toggleTheme }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
