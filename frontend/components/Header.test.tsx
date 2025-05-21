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

describe('Header Component', () => {
  test('renders main navigation links', () => {
    render(<Header />);
    
    // Check if all navigation links are present
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Vendors')).toBeInTheDocument();
    expect(screen.getByText('Questionnaires')).toBeInTheDocument();
    expect(screen.getByText('Trust Portal')).toBeInTheDocument();
    expect(screen.getByText('Compliance')).toBeInTheDocument();
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
  });

  test('toggles profile dropdown when profile button is clicked', () => {
    render(<Header />);
    
    // Find the profile button
    const profileButton = screen.getByText('Profile');
    
    // Initially, the dropdown menu should not be visible
    expect(screen.queryByText('Sarah Anderson')).not.toBeInTheDocument();
    
    // Click profile button to open dropdown
    fireEvent.click(profileButton);
    
    // Now the user info should be visible
    expect(screen.getByText('Sarah Anderson')).toBeInTheDocument();
    expect(screen.getByText('sarah@company.com')).toBeInTheDocument();
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
}); 