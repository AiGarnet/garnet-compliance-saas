'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { setDarkMode, isDarkMode } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { translations } from '@/lib/i18n';

interface ThemeToggleProps {
  className?: string;
  locale?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ 
  className = '',
  locale = 'en',
  showLabel = false,
  size = 'md'
}: ThemeToggleProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  // Get translations based on locale
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  // Initialize state from the current theme
  useEffect(() => {
    setTheme(isDarkMode() ? 'dark' : 'light');
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setDarkMode(newTheme === 'dark');
    setTheme(newTheme);
  };
  
  // Size classes mapping
  const sizeClasses = {
    sm: 'p-1 text-sm',
    md: 'p-2 text-base',
    lg: 'p-3 text-lg'
  };
  
  const iconSize = {
    sm: 16,
    md: 20,
    lg: 24
  };

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 transition-colors',
        theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300',
        sizeClasses[size],
        className
      )}
      aria-label={theme === 'light' ? t.darkMode : t.lightMode}
      title={theme === 'light' ? t.darkMode : t.lightMode}
    >
      {theme === 'light' ? (
        <>
          <Moon size={iconSize[size]} className="text-gray-700" />
          {showLabel && <span className="text-gray-700">{t.darkMode}</span>}
        </>
      ) : (
        <>
          <Sun size={iconSize[size]} className="text-gray-200" />
          {showLabel && <span className="text-gray-200">{t.lightMode}</span>}
        </>
      )}
    </button>
  );
} 