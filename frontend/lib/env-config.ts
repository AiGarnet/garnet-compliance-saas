// Environment configuration
export interface EnvConfig {
  isDevelopment: boolean;
  isProduction: boolean;
  features: {
    enableDevMode: boolean;
  };
}

// Default to development environment unless explicitly set to production
const isProd = process.env.NODE_ENV === 'production';

export const envConfig: EnvConfig = {
  isDevelopment: !isProd,
  isProduction: isProd,
  features: {
    // Developer mode is always OFF by default, regardless of environment
    // It can be explicitly enabled via localStorage
    enableDevMode: typeof window !== 'undefined' && localStorage.getItem('enableDevMode') === 'true'
  }
};

// Helper functions
export const toggleDevMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const newValue = localStorage.getItem('enableDevMode') !== 'true';
  localStorage.setItem('enableDevMode', newValue ? 'true' : 'false');
  
  // Force a page refresh to apply the changes
  window.location.reload();
  
  return newValue;
};

export const isDevModeEnabled = (): boolean => {
  return envConfig.features.enableDevMode;
}; 