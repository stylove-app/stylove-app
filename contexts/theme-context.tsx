import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import {
  StyloveColors,
  StyloveDarkColors,
  StyloveShadow,
  type StylovePalette,
} from '@/constants/stylove-theme';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = '@stylove/theme-mode';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  colors: StylovePalette;
  setMode: (mode: ThemeMode) => void;
  toggleDark: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('light');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
      setReady(true);
    });
  }, []);

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(THEME_KEY, next);
  }, []);

  const isDark = mode === 'dark' || (mode === 'system' && systemScheme === 'dark');
  const colors = isDark ? StyloveDarkColors : StyloveColors;

  const toggleDark = useCallback(() => {
    setMode(isDark ? 'light' : 'dark');
  }, [isDark, setMode]);

  const value = useMemo(
    () => ({ mode, isDark, colors, setMode, toggleDark }),
    [mode, isDark, colors, setMode, toggleDark],
  );

  if (!ready) {
    return (
      <ThemeContext.Provider
        value={{
          mode: 'light',
          isDark: false,
          colors: StyloveColors,
          setMode: async () => {},
          toggleDark: () => {},
        }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

export { StyloveShadow };
