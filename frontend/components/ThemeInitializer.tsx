'use client';

import { useEffect } from 'react';
import { initializeTheme } from '@/lib/design-tokens';

export function ThemeInitializer() {
  useEffect(() => {
    // Initialize theme based on user preferences
    initializeTheme();
  }, []);

  // This component doesn't render anything
  return null;
} 