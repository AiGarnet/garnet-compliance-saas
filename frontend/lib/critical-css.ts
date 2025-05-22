/**
 * Critical CSS Utilities
 * Provides minimal CSS required for initial page rendering
 */

import React from 'react';

/**
 * Main critical CSS for fast initial paint
 * These styles are essential for above-the-fold content
 */
export const criticalStyles = `
:root{--font-size-base:1rem;--font-family-sans:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;--font-weight-normal:400;--line-height-normal:1.5;--color-primary:124 58 237;--color-gray-50:249 250 251;--color-gray-900:17 24 39;}
body{margin:0;font-family:var(--font-family-sans);font-size:var(--font-size-base);line-height:var(--line-height-normal);color:rgb(var(--color-gray-900));background-color:rgb(var(--color-gray-50));}
.skip-link{position:absolute;top:-9999px;left:0;padding:8px;background-color:rgb(var(--color-primary));color:white;z-index:9999;}
.skip-link:focus{top:0;}
.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border-width:0;}
`;

/**
 * Append additional styles to critical CSS
 * Use this to add component-specific styles that are needed for above-the-fold content
 * 
 * @param additionalStyles - The additional styles to append
 * @returns The combined critical styles
 */
export function appendToCriticalStyles(additionalStyles: string): string {
  return `${criticalStyles}${minifyCss(additionalStyles)}`;
}

/**
 * Simple CSS minification function
 * 
 * @param css - The CSS to minify
 * @returns The minified CSS
 */
export function minifyCss(css: string): string {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')            // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, '$1') // Remove spaces around brackets, braces, parentheses, etc.
    .replace(/;\}/g, '}')             // Remove trailing semicolons
    .trim();
}

/**
 * Generate a style tag with critical CSS
 */
export function CriticalStyleTag(): React.ReactElement {
  return React.createElement('style', {
    id: 'critical-css',
    dangerouslySetInnerHTML: { __html: criticalStyles }
  });
}

/**
 * Determine if a CSS file should be preloaded
 * Use this to decide which non-critical stylesheets should be preloaded
 * 
 * @param href - The path to the CSS file
 * @returns Boolean indicating if the file should be preloaded
 */
export function shouldPreloadCss(href: string): boolean {
  const preloadPaths = [
    '/globals.css',
    '/design-tokens.css',
  ];
  
  return preloadPaths.some(path => href.includes(path));
} 