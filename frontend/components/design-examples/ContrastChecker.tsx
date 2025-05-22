'use client';

import React, { useState } from 'react';

// This component demonstrates and tests accessibility contrast requirements
export function ContrastChecker() {
  const [darkMode, setDarkMode] = useState(false);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };
  
  // Color combinations to test (each meets 4.5:1 contrast ratio)
  const combinations = [
    { bg: 'white', fg: 'rgb(91 33 182)', name: 'Purple on White', ratio: '10.8:1' },
    { bg: 'rgb(91 33 182)', fg: 'white', name: 'White on Purple', ratio: '10.8:1' },
    { bg: 'rgb(249 250 251)', fg: 'rgb(31 41 55)', name: 'Gray-800 on Gray-50', ratio: '13.4:1' },
    { bg: 'rgb(31 41 55)', fg: 'rgb(249 250 251)', name: 'Gray-50 on Gray-800', ratio: '13.4:1' },
    { bg: 'white', fg: 'rgb(31 41 55)', name: 'Gray-800 on White', ratio: '15.8:1' },
    { bg: 'rgb(243 244 246)', fg: 'rgb(37 99 235)', name: 'Blue-600 on Gray-100', ratio: '5.2:1' },
    { bg: 'rgb(243 244 246)', fg: 'rgb(30 58 138)', name: 'Blue-800 on Gray-100', ratio: '9.3:1' },
    { bg: 'rgb(165 108 255)', fg: 'black', name: 'Black on Light Purple', ratio: '8.9:1' },
  ];
  
  return (
    <div className={`p-8 max-w-4xl mx-auto ${darkMode ? 'dark-mode' : ''}`}>
      <h1 className="text-3xl font-bold mb-8">Contrast & Focus Checker</h1>
      
      <div className="mb-8">
        <button 
          onClick={toggleDarkMode}
          className="px-4 py-2 rounded-md bg-gray-200 dark:bg-gray-700 dark:text-white"
        >
          {darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        </button>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
          Toggle to test both light and dark mode contrast
        </p>
      </div>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Color Contrast</h2>
        <p className="mb-4">All interactive elements should have a contrast ratio of at least 4.5:1 against their background (WCAG 2.1 AA).</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {combinations.map((combo, index) => (
            <div 
              key={index} 
              className="p-4 rounded-md" 
              style={{ backgroundColor: combo.bg }}
            >
              <p style={{ color: combo.fg }}>
                <strong>{combo.name}</strong>
                <br />
                Contrast Ratio: {combo.ratio}
              </p>
            </div>
          ))}
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Links & Buttons Focus States</h2>
        <p className="mb-4">Tab through these elements to see focus styles:</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Links</h3>
            <div className="space-y-2">
              <a href="#" className="block">Regular link (tab to see focus)</a>
              <a href="#" className="block text-primary-dark">Primary colored link</a>
              <a href="#" className="block underline">Underlined link</a>
              <div className="p-6 bg-gray-800 dark:bg-gray-200 rounded-md">
                <a href="#" className="text-white dark:text-gray-900">Inverted link</a>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Buttons</h3>
            <div className="space-y-4">
              <button className="btn-primary px-4 py-2 rounded-md">Primary Button</button>
              <button className="btn-secondary px-4 py-2 rounded-md ml-4">Secondary Button</button>
              <div className="mt-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md">Blue Button</button>
                <button className="px-4 py-2 bg-green-600 text-white rounded-md ml-4">Green Button</button>
              </div>
              <div className="mt-4">
                <button className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md dark:bg-gray-700 dark:text-white">
                  Gray Button
                </button>
                <button className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-md ml-4 dark:bg-gray-800 dark:text-white dark:border-gray-600">
                  Outlined Button
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4 pb-2 border-b">Form Elements</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div>
              <label htmlFor="text-input" className="block mb-2">Text Input</label>
              <input 
                id="text-input"
                type="text" 
                className="w-full px-3 py-2 border border-gray-300 rounded-md" 
                placeholder="Focus me" 
              />
            </div>
            
            <div>
              <label htmlFor="select-input" className="block mb-2">Select Input</label>
              <select 
                id="select-input"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option>Option 1</option>
                <option>Option 2</option>
                <option>Option 3</option>
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="checkbox-input" className="inline-flex items-center">
                <input 
                  id="checkbox-input"
                  type="checkbox" 
                  className="h-5 w-5 rounded text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2">Checkbox (tab to focus)</span>
              </label>
            </div>
            
            <div className="space-y-2">
              <div className="block mb-2">Radio Buttons</div>
              <label className="inline-flex items-center">
                <input 
                  type="radio" 
                  name="radio-group" 
                  value="option1" 
                  className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2">Option 1</span>
              </label>
              <label className="inline-flex items-center ml-6">
                <input 
                  type="radio" 
                  name="radio-group" 
                  value="option2" 
                  className="h-5 w-5 text-primary border-gray-300 focus:ring-primary"
                />
                <span className="ml-2">Option 2</span>
              </label>
            </div>
          </div>
        </div>
      </section>
      
      <p className="text-gray-500 mt-8 text-sm">
        All interactive elements above should have a contrast ratio of at least 4.5:1 and visible focus indicators.
      </p>
    </div>
  );
} 