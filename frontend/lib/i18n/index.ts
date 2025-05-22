import { en } from './en';
import { es } from './es';
import { fr } from './fr';
import { ar } from './ar';

// Define the translation structure type
export type TranslationType = typeof en;

// Export all translations
export const translations: Record<string, TranslationType> = {
  en,
  es,
  fr,
  ar
};

// Export individual languages for direct import
export * from './en';
export * from './es';
export * from './fr';
export * from './ar'; 