import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from 'react';

export type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: 'light' | 'dark';
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: PropsWithChildren) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // Check local storage or default to 'dark'
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('streekx_theme');
      return (saved as Theme) || 'dark';
    }
    return 'dark';
  });

  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = window.document.documentElement;
    
    const applyTheme = () => {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const finalTheme = theme === 'system' ? systemTheme : theme;
      
      setResolvedTheme(finalTheme);
      
      // Tailwind uses the 'dark' class
      if (finalTheme === 'dark') {
          root.classList.add('dark');
          root.classList.remove('light');
          document.body.style.backgroundColor = '#000000';
          document.body.style.color = '#ffffff';
      } else {
          root.classList.add('light');
          root.classList.remove('dark');
          document.body.style.backgroundColor = '#ffffff';
          document.body.style.color = '#000000';
      }
      
      // Update data-theme attribute for CSS variable switching if needed
      root.setAttribute('data-theme', finalTheme);
      
      // Optional: Update meta theme-color for mobile browsers
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
          metaThemeColor.setAttribute('content', finalTheme === 'dark' ? '#000000' : '#ffffff');
      }
    };

    applyTheme();
    localStorage.setItem('streekx_theme', theme);

    // Listen for system changes if in system mode
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = () => applyTheme();
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme: setThemeState, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}