/**
 * CSS Stats Utility
 * 
 * This script analyzes CSS files and reports statistics about their size and performance impact.
 * Run with: node lib/css-stats.js
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Configuration
const cssFiles = [
  '../app/globals.css',
  '../lib/design-tokens.css',
  '../lib/accessibility.css',
];

// Utility to format file size
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Analyze CSS files
function analyzeCssFile(filePath) {
  try {
    const fullPath = path.resolve(__dirname, filePath);
    const content = fs.readFileSync(fullPath, 'utf8');
    
    // Calculate original size
    const originalSize = Buffer.byteLength(content, 'utf8');
    
    // Calculate minified size (simple minification)
    const minified = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([{}:;,])\s*/g, '$1')
      .replace(/;\}/g, '}')
      .trim();
    const minifiedSize = Buffer.byteLength(minified, 'utf8');
    
    // Calculate gzipped size
    const gzipped = zlib.gzipSync(minified);
    const gzippedSize = Buffer.byteLength(gzipped);
    
    // Calculate selector count
    const selectorCount = (content.match(/\{/g) || []).length;
    
    // Calculate media query count
    const mediaQueryCount = (content.match(/@media/g) || []).length;
    
    // Calculate critical CSS percentage (rough estimate based on first 1KB)
    const potentialCriticalCSS = content.substring(0, 1024);
    const criticalCSSPercentage = Math.min(100, (1024 / originalSize) * 100).toFixed(2);
    
    return {
      file: path.basename(filePath),
      originalSize,
      minifiedSize,
      gzippedSize,
      selectorCount,
      mediaQueryCount,
      savingsFromMinification: originalSize - minifiedSize,
      savingsPercentage: ((originalSize - minifiedSize) / originalSize * 100).toFixed(2),
      gzipSavingsPercentage: ((originalSize - gzippedSize) / originalSize * 100).toFixed(2),
      criticalCSSPercentage,
    };
  } catch (error) {
    console.error(`Error analyzing ${filePath}:`, error.message);
    return null;
  }
}

// Main function
function main() {
  console.log('\n=== CSS OPTIMIZATION STATS ===\n');
  
  let totalOriginalSize = 0;
  let totalMinifiedSize = 0;
  let totalGzippedSize = 0;
  
  const results = cssFiles.map(file => {
    const stats = analyzeCssFile(file);
    if (stats) {
      totalOriginalSize += stats.originalSize;
      totalMinifiedSize += stats.minifiedSize;
      totalGzippedSize += stats.gzippedSize;
      return stats;
    }
    return null;
  }).filter(Boolean);
  
  // Print results for each file
  results.forEach(stats => {
    console.log(`File: ${stats.file}`);
    console.log(`  Original Size: ${formatBytes(stats.originalSize)}`);
    console.log(`  Minified Size: ${formatBytes(stats.minifiedSize)} (saved ${stats.savingsPercentage}%)`);
    console.log(`  Gzipped Size: ${formatBytes(stats.gzippedSize)} (saved ${stats.gzipSavingsPercentage}%)`);
    console.log(`  Selectors: ${stats.selectorCount}`);
    console.log(`  Media Queries: ${stats.mediaQueryCount}`);
    console.log(`  Critical CSS estimate: ~${stats.criticalCSSPercentage}% of file`);
    console.log('');
  });
  
  // Print overall stats
  console.log('=== OVERALL STATS ===');
  console.log(`Total Original Size: ${formatBytes(totalOriginalSize)}`);
  console.log(`Total Minified Size: ${formatBytes(totalMinifiedSize)} (saved ${((totalOriginalSize - totalMinifiedSize) / totalOriginalSize * 100).toFixed(2)}%)`);
  console.log(`Total Gzipped Size: ${formatBytes(totalGzippedSize)} (saved ${((totalOriginalSize - totalGzippedSize) / totalOriginalSize * 100).toFixed(2)}%)`);
  
  // Get critical CSS size from file directly instead of requiring it
  try {
    const criticalCssPath = path.resolve(__dirname, './critical-css.ts');
    const criticalCssContent = fs.readFileSync(criticalCssPath, 'utf8');
    const criticalStyles = criticalCssContent.match(/export const criticalStyles = `([^`]+)`/);
    
    if (criticalStyles && criticalStyles[1]) {
      const criticalCssSize = Buffer.byteLength(criticalStyles[1], 'utf8');
      console.log(`Critical CSS: ${formatBytes(criticalCssSize)}`);
      console.log(`Critical CSS percentage: ${((criticalCssSize / totalOriginalSize) * 100).toFixed(2)}%`);
    } else {
      console.log('Could not extract critical CSS size');
    }
  } catch (error) {
    console.log('Critical CSS size not available');
  }
  
  console.log('\n=== RECOMMENDATIONS ===');
  if (totalOriginalSize > 50 * 1024) {
    console.log('⚠️ CSS exceeds 50KB, consider further optimization');
  } else {
    console.log('✅ CSS size is under 50KB, good job!');
  }
  
  if (totalGzippedSize > 14 * 1024) {
    console.log('⚠️ Gzipped CSS exceeds 14KB (first roundtrip size), consider reducing');
  } else {
    console.log('✅ Gzipped CSS fits in first roundtrip (under 14KB)');
  }
}

// Run the analysis
main(); 