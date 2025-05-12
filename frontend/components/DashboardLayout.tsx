"use client";

import React, { ReactNode } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShieldCheck, 
  FileText, 
  Globe, 
  CreditCard, 
  Settings, 
  Users, 
  HelpCircle
} from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      
      {/* Mobile Navigation bar - only visible on small screens */}
      <nav className="md:hidden fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-4 py-3 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link href="/dashboard" className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mr-3">
                  <span className="text-white text-lg font-bold">G</span>
                </div>
                <span className="text-xl font-semibold text-gray-900">
                  Garnet AI
                </span>
              </Link>
            </div>
            <div className="flex items-center">
              <button 
                type="button" 
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300"
                aria-expanded="false"
              >
                <span className="sr-only">Open user menu</span>
                <div className="relative w-8 h-8 overflow-hidden bg-gray-100 rounded-full">
                  <svg className="absolute w-10 h-10 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar - fixed on the left side */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-5 bg-white border-r border-gray-200 hidden md:block">
        <div className="px-6 mb-8">
          <Link href="/dashboard" className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center mr-3">
              <span className="text-white text-lg font-bold">G</span>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Garnet AI</h1>
          </Link>
        </div>
        
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              <Link href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <LayoutDashboard className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/compliance" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <ShieldCheck className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Compliance</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/questionnaires" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <FileText className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Questionnaires</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/trust-portal" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Globe className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Trust Portal</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/billing" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <CreditCard className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Billing</span>
              </Link>
            </li>
            <li className="pt-5 mt-5 border-t border-gray-200">
              <Link href="/dashboard/settings" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Settings className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Settings</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/team" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <Users className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Team</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/help" className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100 group">
                <HelpCircle className="w-5 h-5 text-gray-500 group-hover:text-gray-900" />
                <span className="ml-3">Help & Support</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col w-full md:ml-64 pt-16 md:pt-0">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
