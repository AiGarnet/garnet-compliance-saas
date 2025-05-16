"use client";

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  Globe, 
  Users, 
  Settings, 
  CreditCard, 
  HelpCircle
} from 'lucide-react';

interface NavigationItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export function MobileNavigation() {
  const [isOpen, setIsOpen] = useState(false);
  
  // Close the menu when clicking outside or on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      // Only run if the drawer is open
      if (!isOpen) return;
      
      // Check if we're clicking the toggle button (don't close the drawer)
      const target = e.target as HTMLElement;
      if (target.closest('[data-mobile-toggle]')) return;
      
      // Check if we're clicking inside the drawer
      if (!target.closest('[data-mobile-drawer]')) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);
  
  // Prevent scrolling when the drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const navigationItems: NavigationItem[] = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="h-5 w-5" /> 
    },
    { 
      label: 'Compliance', 
      href: '/compliance', 
      icon: <ShieldCheck className="h-5 w-5" /> 
    },
    { 
      label: 'Documents', 
      href: '/documents', 
      icon: <FileText className="h-5 w-5" /> 
    },
    { 
      label: 'Trust Portal', 
      href: '/trust-portal', 
      icon: <Globe className="h-5 w-5" /> 
    },
    { 
      label: 'Vendors', 
      href: '/vendors', 
      icon: <Users className="h-5 w-5" /> 
    },
    { 
      label: 'Billing', 
      href: '/billing', 
      icon: <CreditCard className="h-5 w-5" /> 
    },
    { 
      label: 'Settings', 
      href: '/settings', 
      icon: <Settings className="h-5 w-5" /> 
    },
    { 
      label: 'Help', 
      href: '/help', 
      icon: <HelpCircle className="h-5 w-5" /> 
    },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        data-mobile-toggle
        aria-label={isOpen ? "Close menu" : "Open menu"}
        aria-expanded={isOpen}
        aria-controls="mobile-navigation"
        className="lg:hidden flex items-center justify-center w-11 h-11 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? (
          <X className="h-6 w-6 text-gray-700" />
        ) : (
          <Menu className="h-6 w-6 text-gray-700" />
        )}
      </button>
      
      {/* Mobile Navigation Drawer */}
      <div 
        id="mobile-navigation"
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "block" : "hidden"
        )}
      >
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 bg-gray-800/40 transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0"
          )} 
          aria-hidden="true"
        />
        
        {/* Drawer */}
        <div
          data-mobile-drawer
          className={cn(
            "fixed inset-y-0 left-0 flex w-3/4 max-w-xs flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Drawer Header */}
          <div className="flex items-center justify-between px-6 h-16 border-b border-gray-200">
            <span className="text-lg font-semibold text-gray-900">GarnetAI</span>
            <button
              aria-label="Close menu"
              className="h-10 w-10 flex items-center justify-center rounded-full"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-1">
              {navigationItems.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center gap-x-3 px-3 py-4 rounded-lg text-base font-medium transition-colors",
                      item.href === '/dashboard'
                        ? "bg-primary-light text-primary"
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                    onClick={() => setIsOpen(false)}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User Section */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex items-center gap-x-3">
              <div className="h-10 w-10 rounded-full bg-primary-light flex items-center justify-center">
                <span className="text-primary font-medium">SA</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Sarah Anderson</p>
                <p className="text-xs text-gray-500">sarah@company.com</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 