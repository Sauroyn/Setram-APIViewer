import { useState, useEffect } from 'react';

export type Theme = 'light' | 'dark';

export function useTheme() {
  // Détecte le thème initial (préférence système ou stocké)
  const getInitialTheme = (): Theme => {
    const stored = localStorage.getItem('theme') as Theme | null;
    if (stored) return stored;
    
    // Détecte la préférence système
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    // Sauvegarde le thème dans le localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return { theme, setTheme, toggleTheme };
}
