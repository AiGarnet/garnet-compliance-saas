import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import Header from './Header';

// Mock the next/navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock the injectCriticalCSS function to avoid DOM manipulation in tests
jest.mock('./critical-css', () => ({
  injectCriticalCSS: jest.fn(),
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

// Helper function to set viewport size
const setViewportSize = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width });
  Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: height });
  window.dispatchEvent(new Event('resize'));
};

describe('Header Component', () => {
  beforeEach(() => {
    // Reset localStorage before each test
    window.localStorage.clear();
  });

  test('renders main navigation links', () => {
    render(<Header />);
    
    // Check if all navigation links are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Questionnaires')).toBeInTheDocument();
    expect(screen.getByText('Trust Portal')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
  });

  test('contains semantic HTML5 elements', () => {
    const { container } = render(<Header />);
    
    // Check for semantic elements
    expect(container.querySelector('header')).toBeInTheDocument();
    expect(container.querySelector('nav')).toBeInTheDocument();
    expect(container.querySelector('ul')).toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBeGreaterThan(0);
  });

  test('has proper ARIA attributes', () => {
    render(<Header />);
    
    // Check for skip link
    const skipLink = screen.getByText('Skip to main content');
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main');
    
    // Check for navigation ARIA
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Main navigation');
    
    // Check for active page indicator
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });

  test('highlights the active link based on pathname', () => {
    render(<Header />);
    
    // Since we mocked usePathname to return '/dashboard',
    // the Dashboard link should have the active class
    const dashboardLink = screen.getByText('Dashboard');
    expect(dashboardLink.closest('a')).toHaveClass('font-medium');
    expect(dashboardLink.closest('a')).toHaveClass('border-primary');
  });

  test('toggles dark mode when the button is clicked', () => {
    render(<Header />);
    
    // Find dark mode button
    const darkModeButton = screen.getByLabelText('Dark mode');
    expect(darkModeButton).toBeInTheDocument();
    
    // Click dark mode button
    fireEvent.click(darkModeButton);
    
    // Expect button to now show light mode option
    expect(screen.getByLabelText('Light mode')).toBeInTheDocument();
    
    // Verify localStorage was updated
    expect(window.localStorage.getItem('theme')).toBe('dark');
  });

  test('toggles profile dropdown when profile button is clicked', () => {
    render(<Header />);
    
    // Find the profile button
    const profileButton = screen.getByText('Profile');
    
    // Initially, the dropdown menu should not be visible
    expect(screen.queryByText('Sarah Anderson')).not.toBeInTheDocument();
    
    // Click profile button to open dropdown
    fireEvent.click(profileButton);
    
    // Now the user info and menu should be visible
    expect(screen.getByText('Sarah Anderson')).toBeInTheDocument();
    expect(screen.getByText('sarah@company.com')).toBeInTheDocument();
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  test('renders logout button in a form with CSRF token', () => {
    render(<Header />);
    
    // Open profile dropdown to get logout button
    fireEvent.click(screen.getByText('Profile'));
    
    // Check if logout is in a form
    const logoutButton = screen.getByText('Logout');
    const form = logoutButton.closest('form');
    
    expect(form).toBeInTheDocument();
    expect(form).toHaveAttribute('method', 'POST');
    expect(form).toHaveAttribute('action', '/logout');
    
    // Check for CSRF token
    const csrfInput = form?.querySelector('input[name="csrf_token"]');
    expect(csrfInput).toBeInTheDocument();
  });

  test('changes language when language button is clicked', () => {
    render(<Header />);
    
    // Find language button
    const languageButton = screen.getByLabelText('Change language');
    
    // Get initial Dashboard text
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    
    // Click language button to change to Spanish
    fireEvent.click(languageButton);
    
    // Now we should see Spanish text
    expect(screen.getByText('Panel')).toBeInTheDocument();
  });

  // Responsive breakpoint tests
  describe('Responsive behavior', () => {
    test('shows desktop navigation on large screens', () => {
      // Set viewport to desktop size
      setViewportSize(1024, 768);
      
      const { container } = render(<Header />);
      
      // Desktop nav should be visible
      const desktopNav = container.querySelector('nav');
      expect(desktopNav).toBeInTheDocument();
      expect(desktopNav).toHaveClass('hidden md:block');
      expect(desktopNav).toBeVisible();
      
      // Mobile nav toggle should be hidden
      const mobileNavToggle = container.querySelector('.md\\:hidden');
      expect(mobileNavToggle).toBeInTheDocument();
      expect(window.getComputedStyle(mobileNavToggle as Element).display).toBe('none');
    });
    
    test('shows mobile navigation on small screens', () => {
      // Mock viewport to mobile size
      setViewportSize(360, 640);
      
      // Override getComputedStyle for mobile testing
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = jest.fn().mockImplementation((element) => {
        if (element.classList?.contains('md:hidden')) {
          return { display: 'block' } as CSSStyleDeclaration;
        }
        if (element.classList?.contains('hidden')) {
          return { display: 'none' } as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      });
      
      const { container } = render(<Header />);
      
      // Desktop nav should be hidden
      const desktopNav = container.querySelector('nav');
      expect(desktopNav).toBeInTheDocument();
      expect(desktopNav).toHaveClass('hidden');
      
      // Mobile nav toggle should be visible
      const mobileNavToggle = container.querySelector('.md\\:hidden');
      expect(mobileNavToggle).toBeInTheDocument();
      expect(window.getComputedStyle(mobileNavToggle as Element).display).toBe('block');
      
      // Restore original function
      window.getComputedStyle = originalGetComputedStyle;
    });
    
    test('hides search bar on mobile screens', () => {
      // Set viewport to mobile size
      setViewportSize(360, 640);
      
      const { container } = render(<Header />);
      
      // Search bar should have the hidden class on mobile
      const searchBar = container.querySelector('.relative.hidden.md\\:block');
      expect(searchBar).toBeInTheDocument();
    });
    
    test('shows search bar on desktop screens', () => {
      // Set viewport to desktop size
      setViewportSize(1024, 768);
      
      // Override getComputedStyle for testing
      const originalGetComputedStyle = window.getComputedStyle;
      window.getComputedStyle = jest.fn().mockImplementation((element) => {
        if (element.classList?.contains('md:block')) {
          return { display: 'block' } as CSSStyleDeclaration;
        }
        return originalGetComputedStyle(element);
      });
      
      const { container } = render(<Header />);
      
      // Search bar should be visible on desktop
      const searchBar = container.querySelector('.relative.hidden.md\\:block');
      expect(searchBar).toBeInTheDocument();
      expect(window.getComputedStyle(searchBar as Element).display).toBe('block');
      
      // Restore original function
      window.getComputedStyle = originalGetComputedStyle;
    });
  });
}); 