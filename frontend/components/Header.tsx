"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Menu, 
  X, 
  User, 
  LogOut, 
  Bell, 
  Search,
  Moon,
  Sun,
  Globe,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileNavigation } from './MobileNavigation';
import { translations } from '@/lib/i18n';
import { injectCriticalCSS } from './critical-css';

// Remove the hardcoded CSS variables since we're using the ones from critical-css
// const cssVariables = {
//   style: {
//     '--primary-color': '#3b82f6',
//     '--primary-light': '#93c5fd',
//     '--header-bg': '#ffffff',
//     '--header-text': '#1f2937',
//     '--font-size-sm': '0.875rem',
//     '--font-size-base': '1rem',
//     '--font-size-lg': '1.125rem',
//   } as React.CSSProperties
// };

interface HeaderProps {
  locale?: string;
}

export default function Header({ locale = 'en' }: HeaderProps) {
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [currentLocale, setCurrentLocale] = useState(locale);
  
  // Inject critical CSS on component mount and check for saved theme preference
  useEffect(() => {
    injectCriticalCSS();
    
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark-mode');
    } else {
      // Explicitly set light mode theme as default
      localStorage.setItem('theme', 'light');
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark-mode');
    }
  }, []);
  
  // Toggle dark mode
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    // Save preference to localStorage
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    
    // Toggle dark mode class on the html element to affect the entire application
    if (newDarkMode) {
      document.documentElement.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark-mode');
    }
  };

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (isProfileOpen && !(e.target as HTMLElement).closest('[data-profile-dropdown]')) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isProfileOpen]);

  // Get translations based on locale
  const t = translations[currentLocale as keyof typeof translations] || translations.en;

  // Navigation items
  const navItems = [
    { href: '/dashboard', label: t.dashboard },
    { href: '/vendors', label: t.vendors },
    { href: '/questionnaires', label: t.questionnaires },
    { href: '/trust-portal', label: t.trustPortal },
    { href: '/compliance', label: t.compliance },
  ];

  // Available languages
  const languages = [
    { code: 'en', label: 'English' },
    { code: 'es', label: 'Español' },
    { code: 'fr', label: 'Français' },
    { code: 'ar', label: 'العربية' }, // Arabic for RTL testing
  ];

  return (
    <header 
      className="sticky top-0 z-30 transition-colors"
    >
      {/* Skip to content link - visually hidden but accessible */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:p-4 focus:bg-primary focus:text-white focus:z-50"
      >
        {t.skipToContent}
      </a>
      
      <div className="w-full max-w-screen-2xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand - adjusted left spacing */}
          <div className="flex items-center pl-0 md:pl-0">
            <Link href="/" className="flex items-center" aria-label={t.homePage}>
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center mr-2">
                <span className="text-white text-lg font-bold">G</span>
              </div>
              <span className="text-xl font-semibold">
                GarnetAI
              </span>
            </Link>
          </div>
          
          {/* Main Navigation - centered */}
          <nav aria-label="Main navigation" className="hidden md:block flex-grow">
            <ul className="flex justify-center space-x-6 px-4">
              {navItems.map((item) => (
                <li key={item.href}>
                  <Link 
                    href={item.href}
                    className={cn(
                      "hover:text-primary min-h-[44px] min-w-[44px] flex items-center px-3 py-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30",
                      pathname === item.href && "text-primary font-medium border-b-2 border-primary"
                    )}
                    aria-current={pathname === item.href ? 'page' : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* Right side controls - adjusted right spacing */}
          <div className="flex items-center gap-2 pr-0 md:pr-0">
            {/* Search Bar */}
            <div className="relative hidden md:block">
              <div className={cn(
                "transition-all duration-200",
                isSearchOpen ? "w-64" : "w-10"
              )}>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="absolute inset-y-0 left-0 flex items-center pl-3"
                  aria-label={t.search}
                >
                  <Search className="h-5 w-5" />
                </button>
                <input
                  type="text"
                  placeholder={isSearchOpen ? t.searchPlaceholder : ""}
                  className={cn(
                    "pl-10 py-2 pr-4 rounded-full text-sm bg-controls-bg focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200",
                    isSearchOpen ? "w-full opacity-100" : "w-10 opacity-0 cursor-pointer"
                  )}
                  aria-hidden={!isSearchOpen}
                />
              </div>
            </div>
            
            {/* Notifications Bell */}
            <button
              className="min-h-[44px] min-w-[44px] p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              aria-label={t.notifications}
            >
              <Bell className="h-5 w-5" />
            </button>
            
            {/* Dark Mode Toggle */}
            <button
              className="min-h-[44px] min-w-[44px] p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
              onClick={toggleDarkMode}
              aria-label={isDarkMode ? t.lightMode : t.darkMode}
            >
              {isDarkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            
            {/* Language Selector */}
            <div className="relative">
              <button
                className="min-h-[44px] min-w-[44px] p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                aria-label={t.language}
                onClick={() => {
                  // Toggle through languages for simplicity
                  const currentIndex = languages.findIndex(l => l.code === currentLocale);
                  const nextIndex = (currentIndex + 1) % languages.length;
                  setCurrentLocale(languages[nextIndex].code);
                }}
              >
                <Globe className="h-5 w-5" />
              </button>
            </div>
            
            {/* Profile Dropdown */}
            <div className="relative" data-profile-dropdown>
              <button
                className="min-h-[44px] min-w-[44px] p-2 flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                aria-expanded={isProfileOpen}
                aria-haspopup="true"
              >
                <div className="h-8 w-8 rounded-full bg-primary-light flex items-center justify-center dark:bg-primary-dark">
                  <span className="text-primary font-medium dark:text-white">SA</span>
                </div>
                <span className="hidden md:inline">{t.profile}</span>
              </button>
              
              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-card-bg rounded-md shadow-lg py-1 z-10 border border-card-border">
                  <div className="px-4 py-2 border-b border-card-border">
                    <div className="text-sm font-medium">Sarah Anderson</div>
                    <div className="text-xs text-muted-text">sarah@company.com</div>
                  </div>
                  
                  <button 
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-controls-bg focus:bg-controls-bg focus:outline-none"
                    role="menuitem"
                  >
                    <User className="h-4 w-4 inline-block mr-2" />
                    {t.profile}
                  </button>
                  
                  <form method="POST" action="/logout">
                    <input type="hidden" name="csrf_token" value="fake-csrf-token" />
                    <button 
                      type="submit"
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-controls-bg focus:bg-controls-bg focus:outline-none"
                      role="menuitem"
                    >
                      <LogOut className="h-4 w-4 inline-block mr-2" />
                      {t.logout}
                    </button>
                  </form>
                </div>
              )}
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden">
              <MobileNavigation />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
} 