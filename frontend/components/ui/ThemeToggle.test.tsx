import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ThemeToggle } from './ThemeToggle';
import { isDarkMode, setDarkMode } from '@/lib/design-tokens';

// Mock the design-tokens functions
jest.mock('@/lib/design-tokens', () => ({
  isDarkMode: jest.fn(),
  setDarkMode: jest.fn(),
}));

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string): string | null => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('ThemeToggle Component', () => {
  beforeEach(() => {
    // Reset mocks and localStorage before each test
    jest.clearAllMocks();
    window.localStorage.clear();
    (isDarkMode as jest.Mock).mockReturnValue(false);
  });

  test('renders in light mode by default', () => {
    render(<ThemeToggle />);
    
    // Should have Moon icon for dark mode toggle
    expect(screen.getByLabelText('Dark mode')).toBeInTheDocument();
  });

  test('renders in dark mode when isDarkMode returns true', () => {
    (isDarkMode as jest.Mock).mockReturnValue(true);
    
    render(<ThemeToggle />);
    
    // Should have Sun icon for light mode toggle
    expect(screen.getByLabelText('Light mode')).toBeInTheDocument();
  });

  test('toggles between light and dark mode when clicked', () => {
    render(<ThemeToggle />);
    
    // Initially in light mode
    const toggleButton = screen.getByLabelText('Dark mode');
    
    // Click to toggle to dark mode
    fireEvent.click(toggleButton);
    
    // Should call setDarkMode with true
    expect(setDarkMode).toHaveBeenCalledWith(true);
  });

  test('shows label when showLabel is true', () => {
    render(<ThemeToggle showLabel />);
    
    // Should show "Dark mode" text
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  test('applies different size classes based on size prop', () => {
    const { rerender } = render(<ThemeToggle size="sm" />);
    
    // Small size
    let button = screen.getByRole('button');
    expect(button).toHaveClass('p-1');
    expect(button).toHaveClass('text-sm');
    
    // Medium size (default)
    rerender(<ThemeToggle size="md" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('p-2');
    expect(button).toHaveClass('text-base');
    
    // Large size
    rerender(<ThemeToggle size="lg" />);
    button = screen.getByRole('button');
    expect(button).toHaveClass('p-3');
    expect(button).toHaveClass('text-lg');
  });

  test('applies custom className when provided', () => {
    render(<ThemeToggle className="custom-class" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
  });

  test('uses translations based on locale', () => {
    render(<ThemeToggle locale="es" />);
    
    // Should use Spanish translation
    expect(screen.getByLabelText('Modo oscuro')).toBeInTheDocument();
  });

  // Responsive test
  test('maintains touch target size across breakpoints', () => {
    const { container } = render(<ThemeToggle />);
    
    const button = screen.getByRole('button');
    const style = window.getComputedStyle(button);
    
    // Button should be at least 44x44 pixels for touch targets
    expect(parseFloat(style.minHeight) >= 44 || 
           parseFloat(style.height) >= 44).toBeTruthy();
  });
}); 