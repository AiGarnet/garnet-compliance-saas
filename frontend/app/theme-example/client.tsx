'use client';

import React from 'react';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

export function ClientThemeDemo() {
  return (
    <div className="min-h-screen transition-colors duration-300" 
         style={{
           backgroundColor: 'var(--color-body-bg)',
           color: 'var(--color-body-text)'
         }}>
      <header className="p-4 shadow-md transition-colors duration-300"
              style={{
                backgroundColor: 'var(--color-header-bg)',
                color: 'var(--color-header-text)'
              }}>
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold">Theme Toggle Example</h1>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-primary hover:underline">
              Back to Dashboard
            </Link>
            <ThemeToggle showLabel />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto py-8 px-4">
        <section className="mb-12">
          <h2 className="text-xl font-semibold mb-4">Theme Toggle Variants</h2>
          <div className="flex flex-wrap gap-4">
            <div className="p-4 border rounded-lg" style={{borderColor: 'var(--color-card-border)'}}>
              <p className="mb-2">Small:</p>
              <ThemeToggle size="sm" />
            </div>
            <div className="p-4 border rounded-lg" style={{borderColor: 'var(--color-card-border)'}}>
              <p className="mb-2">Medium (default):</p>
              <ThemeToggle />
            </div>
            <div className="p-4 border rounded-lg" style={{borderColor: 'var(--color-card-border)'}}>
              <p className="mb-2">Large:</p>
              <ThemeToggle size="lg" />
            </div>
            <div className="p-4 border rounded-lg" style={{borderColor: 'var(--color-card-border)'}}>
              <p className="mb-2">With Label:</p>
              <ThemeToggle showLabel />
            </div>
          </div>
        </section>
        
        <section className="my-12">
          <h2 className="text-xl font-semibold mb-4">Theme Demo</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-lg shadow-md" style={{
              backgroundColor: 'var(--color-card-bg)',
              color: 'var(--color-card-text)',
              borderColor: 'var(--color-card-border)'
            }}>
              <h3 className="text-lg font-medium mb-3">Card Example</h3>
              <p className="mb-4">This card adapts to the current theme.</p>
              <button className="px-4 py-2 rounded-md bg-primary text-white">
                Primary Button
              </button>
            </div>
            
            <div className="p-6 rounded-lg border" style={{
              borderColor: 'var(--color-card-border)'
            }}>
              <h3 className="text-lg font-medium mb-3">Form Elements</h3>
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Input Example
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-2 rounded-md border" 
                    placeholder="Type something..."
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      color: 'var(--color-input-text)',
                      borderColor: 'var(--color-input-border)'
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 text-sm font-medium">
                    Select Example
                  </label>
                  <select 
                    className="w-full p-2 rounded-md border"
                    style={{
                      backgroundColor: 'var(--color-input-bg)',
                      color: 'var(--color-input-text)',
                      borderColor: 'var(--color-input-border)'
                    }}
                  >
                    <option>Option 1</option>
                    <option>Option 2</option>
                    <option>Option 3</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
} 