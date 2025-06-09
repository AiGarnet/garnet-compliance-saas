'use client';

import { useEffect } from 'react';
import { initializeTheme, forceLightMode } from '@/lib/design-tokens';

export function ThemeInitializer() {
  useEffect(() => {
    // Always force light mode on every page load
    forceLightMode();
    initializeTheme();
  }, []);

  // This component doesn't render anything
  return null;
} 