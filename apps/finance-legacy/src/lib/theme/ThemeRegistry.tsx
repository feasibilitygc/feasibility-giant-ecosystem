'use client';

import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { ReactNode, createContext, useContext, useMemo, useState, useEffect } from 'react';
import { lightTheme, darkTheme } from '@/lib/theme';
import { useTenant } from '@/lib/api/contexts/TenantContext';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  isDarkMode: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeRegistry');
  }
  return context;
}

const THEME_MODE_KEY = 'coop_theme_mode';

export default function ThemeRegistry({ children }: { children: ReactNode }) {
  const { tenant } = useTenant();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // Load saved theme preference
  useEffect(() => {
    const savedMode = localStorage.getItem(THEME_MODE_KEY) as ThemeMode | null;
    if (savedMode) {
      setModeState(savedMode);
    }
  }, []);

  // Detect system preference for 'system' mode
  useEffect(() => {
    if (mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(mediaQuery.matches);

      const handleChange = (e: MediaQueryListEvent) => {
        setIsDarkMode(e.matches);
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setIsDarkMode(mode === 'dark');
    }
  }, [mode]);

  // Update theme preference in localStorage
  const setMode = (newMode: ThemeMode) => {
    setModeState(newMode);
    localStorage.setItem(THEME_MODE_KEY, newMode);
  };

  // Inject CSS Custom Properties for Tailwind CSS dynamically
  useEffect(() => {
    if (tenant?.theme) {
      const root = document.documentElement;
      root.style.setProperty('--primary-color', tenant.theme.primary_color);
      root.style.setProperty('--secondary-color', tenant.theme.secondary_color);
    }
  }, [tenant]);

  // Select and dynamically customize theme based on tenant config and mode
  const theme = useMemo(() => {
    const baseTheme = isDarkMode ? darkTheme : lightTheme;
    if (!tenant?.theme) return baseTheme;

    const { primary_color, secondary_color } = tenant.theme;
    
    // Create a new customized theme by merging custom palette colors into baseTheme
    return createTheme(baseTheme, {
      palette: {
        primary: {
          main: primary_color,
        },
        secondary: {
          main: secondary_color,
        },
      },
    });
  }, [isDarkMode, tenant]);

  // Theme context value
  const contextValue = useMemo(
    () => ({
      mode,
      setMode,
      isDarkMode,
    }),
    [mode, isDarkMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
