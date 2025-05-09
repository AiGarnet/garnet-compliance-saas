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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      
      {/* Navigation bar */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="px-4 py-3 md:px-6 lg:px-8 w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <Link href="/dashboard" className="flex ml-2 md:mr-24">
                <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap dark:text-white">
                  Garnet AI
                </span>
              </Link>
            </div>
            <div className="flex items-center ml-3">
              <button 
                type="button" 
                className="flex text-sm bg-gray-800 rounded-full focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-expanded="false"
              >
                <span className="sr-only">Open user menu</span>
                <div className="relative w-8 h-8 overflow-hidden bg-gray-100 rounded-full dark:bg-gray-600">
                  <svg className="absolute w-10 h-10 text-gray-400 -left-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className="fixed top-0 left-0 z-40 w-64 h-screen pt-20 bg-white border-r border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="h-full px-3 pb-4 overflow-y-auto">
          <ul className="space-y-2 font-medium">
            <li>
              <Link href="/dashboard" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <LayoutDashboard className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/compliance" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <ShieldCheck className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Compliance</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/questionnaires" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <FileText className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Questionnaires</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/trust-portal" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <Globe className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Trust Portal</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/billing" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <CreditCard className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Billing</span>
              </Link>
            </li>
            <li className="pt-5 mt-5 border-t border-gray-200 dark:border-gray-700">
              <Link href="/dashboard/settings" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <Settings className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Settings</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/team" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <Users className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Team</span>
              </Link>
            </li>
            <li>
              <Link href="/dashboard/help" className="flex items-center p-2 text-gray-900 rounded-lg dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 group">
                <HelpCircle className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white" />
                <span className="ml-3">Help & Support</span>
              </Link>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-col w-full pt-20 px-6 sm:ml-64">
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
