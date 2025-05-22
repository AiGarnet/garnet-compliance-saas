'use client';

import React from 'react';

/**
 * Design Tokens Example Component
 * Showcases the design tokens used throughout the application
 */
export function DesignTokensExample() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Design Tokens</h1>
      
      {/* Typography Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Typography</h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-medium mb-2">Font Sizes</h3>
            <div className="space-y-2">
              <p style={{ fontSize: 'var(--font-size-2xs)' }}>2XS: The quick brown fox jumps over the lazy dog (--font-size-2xs)</p>
              <p style={{ fontSize: 'var(--font-size-xs)' }}>XS: The quick brown fox jumps over the lazy dog (--font-size-xs)</p>
              <p style={{ fontSize: 'var(--font-size-sm)' }}>SM: The quick brown fox jumps over the lazy dog (--font-size-sm)</p>
              <p style={{ fontSize: 'var(--font-size-base)' }}>Base: The quick brown fox jumps over the lazy dog (--font-size-base)</p>
              <p style={{ fontSize: 'var(--font-size-lg)' }}>LG: The quick brown fox jumps over the lazy dog (--font-size-lg)</p>
              <p style={{ fontSize: 'var(--font-size-xl)' }}>XL: The quick brown fox jumps over the lazy dog (--font-size-xl)</p>
              <p style={{ fontSize: 'var(--font-size-2xl)' }}>2XL: The quick brown fox jumps over the lazy dog (--font-size-2xl)</p>
              <p style={{ fontSize: 'var(--font-size-3xl)' }}>3XL: The quick brown fox jumps over the lazy dog (--font-size-3xl)</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Font Weights</h3>
            <div className="space-y-2">
              <p style={{ fontWeight: 'var(--font-weight-light)' }}>Light: The quick brown fox jumps over the lazy dog (--font-weight-light)</p>
              <p style={{ fontWeight: 'var(--font-weight-normal)' }}>Normal: The quick brown fox jumps over the lazy dog (--font-weight-normal)</p>
              <p style={{ fontWeight: 'var(--font-weight-medium)' }}>Medium: The quick brown fox jumps over the lazy dog (--font-weight-medium)</p>
              <p style={{ fontWeight: 'var(--font-weight-semibold)' }}>Semibold: The quick brown fox jumps over the lazy dog (--font-weight-semibold)</p>
              <p style={{ fontWeight: 'var(--font-weight-bold)' }}>Bold: The quick brown fox jumps over the lazy dog (--font-weight-bold)</p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Line Heights</h3>
            <div className="space-y-6">
              <div style={{ lineHeight: 'var(--line-height-none)' }} className="p-2 border">
                Line Height None: The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. (--line-height-none)
              </div>
              <div style={{ lineHeight: 'var(--line-height-tight)' }} className="p-2 border">
                Line Height Tight: The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. (--line-height-tight)
              </div>
              <div style={{ lineHeight: 'var(--line-height-normal)' }} className="p-2 border">
                Line Height Normal: The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. (--line-height-normal)
              </div>
              <div style={{ lineHeight: 'var(--line-height-relaxed)' }} className="p-2 border">
                Line Height Relaxed: The quick brown fox jumps over the lazy dog. The quick brown fox jumps over the lazy dog. (--line-height-relaxed)
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Spacing Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Spacing</h2>
        <div className="space-y-6">
          <h3 className="text-lg font-medium mb-2">Spacing Scale</h3>
          <div className="flex flex-wrap gap-4">
            {[1, 2, 3, 4, 6, 8, 12, 16, 20, 24].map(size => (
              <div key={size} className="flex flex-col items-center">
                <div 
                  className="bg-primary-light mb-2" 
                  style={{ 
                    width: `var(--spacing-${size})`, 
                    height: `var(--spacing-${size})` 
                  }}
                ></div>
                <span className="text-xs">{size}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">Spacing Examples (margin/padding)</h3>
            <div className="space-y-4">
              <div className="border p-2">Default padding (p-2 = 0.5rem)</div>
              <div className="border p-4">Medium padding (p-4 = 1rem)</div>
              <div className="border p-8">Large padding (p-8 = 2rem)</div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Colors Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Colors</h2>
        
        <h3 className="text-lg font-medium my-4">Brand Colors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <ColorCard name="Primary" variable="--color-primary" className="bg-primary text-white" />
          <ColorCard name="Primary Light" variable="--color-primary-light" className="bg-primary-light" />
          <ColorCard name="Primary Dark" variable="--color-primary-dark" className="bg-primary-dark text-white" />
          
          <ColorCard name="Secondary" variable="--color-secondary" className="bg-secondary text-white" />
          <ColorCard name="Secondary Light" variable="--color-secondary-light" className="bg-secondary-light" />
          <ColorCard name="Secondary Dark" variable="--color-secondary-dark" className="bg-secondary-dark text-white" />
        </div>
        
        <h3 className="text-lg font-medium my-4">Semantic Colors</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
          <ColorCard name="Success" variable="--color-success" className="bg-success text-white" />
          <ColorCard name="Success Light" variable="--color-success-light" className="bg-success-light" />
          <ColorCard name="Success Dark" variable="--color-success-dark" className="bg-success-dark text-white" />
          
          <ColorCard name="Danger" variable="--color-danger" className="bg-danger text-white" />
          <ColorCard name="Danger Light" variable="--color-danger-light" className="bg-danger-light" />
          <ColorCard name="Danger Dark" variable="--color-danger-dark" className="bg-danger-dark text-white" />
          
          <ColorCard name="Warning" variable="--color-warning" className="bg-warning text-white" />
          <ColorCard name="Warning Light" variable="--color-warning-light" className="bg-warning-light" />
          <ColorCard name="Warning Dark" variable="--color-warning-dark" className="bg-warning-dark text-white" />
          
          <ColorCard name="Info" variable="--color-info" className="bg-info text-white" />
          <ColorCard name="Info Light" variable="--color-info-light" className="bg-info-light" />
          <ColorCard name="Info Dark" variable="--color-info-dark" className="bg-info-dark text-white" />
        </div>
        
        <h3 className="text-lg font-medium my-4">Gray Scale</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <ColorCard name="Gray 50" variable="--color-gray-50" className="bg-gray-50" />
          <ColorCard name="Gray 100" variable="--color-gray-100" className="bg-gray-100" />
          <ColorCard name="Gray 200" variable="--color-gray-200" className="bg-gray-200" />
          <ColorCard name="Gray 300" variable="--color-gray-300" className="bg-gray-300" />
          <ColorCard name="Gray 400" variable="--color-gray-400" className="bg-gray-400" />
          <ColorCard name="Gray 500" variable="--color-gray-500" className="bg-gray-500 text-white" />
          <ColorCard name="Gray 600" variable="--color-gray-600" className="bg-gray-600 text-white" />
          <ColorCard name="Gray 700" variable="--color-gray-700" className="bg-gray-700 text-white" />
          <ColorCard name="Gray 800" variable="--color-gray-800" className="bg-gray-800 text-white" />
          <ColorCard name="Gray 900" variable="--color-gray-900" className="bg-gray-900 text-white" />
        </div>
      </section>
      
      {/* Radius & Shadows Section */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Radius & Shadows</h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-medium mb-4">Border Radius</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-200 rounded-none h-16 flex items-center justify-center text-sm">None</div>
              <div className="bg-gray-200 rounded-sm h-16 flex items-center justify-center text-sm">Small</div>
              <div className="bg-gray-200 rounded-md h-16 flex items-center justify-center text-sm">Medium</div>
              <div className="bg-gray-200 rounded-lg h-16 flex items-center justify-center text-sm">Large</div>
              <div className="bg-gray-200 rounded-xl h-16 flex items-center justify-center text-sm">X-Large</div>
              <div className="bg-gray-200 rounded-2xl h-16 flex items-center justify-center text-sm">2X-Large</div>
              <div className="bg-gray-200 rounded-3xl h-16 flex items-center justify-center text-sm">3X-Large</div>
              <div className="bg-gray-200 rounded-full h-16 flex items-center justify-center text-sm">Full</div>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-4">Shadows</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white shadow-sm h-16 flex items-center justify-center text-sm">Shadow SM</div>
              <div className="bg-white shadow h-16 flex items-center justify-center text-sm">Shadow</div>
              <div className="bg-white shadow-md h-16 flex items-center justify-center text-sm">Shadow MD</div>
              <div className="bg-white shadow-lg h-16 flex items-center justify-center text-sm">Shadow LG</div>
              <div className="bg-white shadow-xl h-16 flex items-center justify-center text-sm">Shadow XL</div>
              <div className="bg-white shadow-2xl h-16 flex items-center justify-center text-sm">Shadow 2XL</div>
              <div className="bg-white shadow-inner h-16 flex items-center justify-center text-sm">Shadow Inner</div>
            </div>
          </div>
        </div>
      </section>
      
      <p className="text-gray-500 mt-8 text-sm">
        Note: All of these design tokens are defined as CSS custom properties in the design-tokens.css file.
      </p>
    </div>
  );
}

// Helper component for color swatches
function ColorCard({ name, className, variable }: { name: string; className: string; variable: string }) {
  return (
    <div className="flex flex-col">
      <div className={`h-16 rounded-md ${className} flex items-center justify-center`}>
        {name}
      </div>
      <code className="text-xs mt-1 text-gray-500">{variable}</code>
    </div>
  );
} 