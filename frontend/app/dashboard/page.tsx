"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Eye, PlusCircle, LogOut, User } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ComplianceCard } from "@/components/dashboard/ComplianceCard";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { VendorList, Vendor, VendorStatus } from "@/components/dashboard/VendorList";
import { MobileNavigation } from "@/components/MobileNavigation";
import { cn } from "@/lib/utils";
import Header from "@/components/Header";
import { DevModeToggle } from "@/components/DevModeToggle";
import { isDevModeEnabled } from "@/lib/env-config";

// Vendor data
const mockVendors = [
  { id: "1", name: "Acme Corp", status: "Questionnaire Pending" as VendorStatus },
  { id: "2", name: "Globex Ltd", status: "In Review" as VendorStatus },
  { id: "3", name: "Stark Industries", status: "Approved" as VendorStatus },
  { id: "4", name: "Wayne Enterprises", status: "Questionnaire Pending" as VendorStatus },
  { id: "5", name: "Oscorp Industries", status: "In Review" as VendorStatus },
  { id: "6", name: "Umbrella Corporation", status: "Approved" as VendorStatus },
];

export default function DashboardPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [simulateError, setSimulateError] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false);

  useEffect(() => {
    // Check developer mode on mount and when it changes
    setIsDevMode(isDevModeEnabled());
    
    // Setup listener for storage changes (in case dev mode is toggled in another tab)
    const handleStorageChange = () => {
      setIsDevMode(isDevModeEnabled());
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Simulate API fetch with delay
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate error for testing
      if (simulateError) {
        throw new Error("Failed to fetch vendors");
      }
      
      setVendors(mockVendors);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError('Unable to load vendors.');
      setIsLoading(false);
    }
  };
  
  // Toggle error simulation for testing
  const toggleErrorSimulation = () => {
    setSimulateError(prev => !prev);
    fetchVendors();
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg">
        {/* Top bar with dev mode toggle in top-right corner */}
        <div className="flex justify-between items-center">
          <section className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white">Welcome back, Sarah</h1>
            <p className="text-gray-600 dark:text-gray-300">Here's an overview of your compliance status</p>
          </section>
          <DevModeToggle />
        </div>
        
        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ComplianceCard percentage={78} change="+12% from last month" />
          
          <QuestionnaireCard count={5} dueSoon="2 due this week" />
          
          <div className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">High-Risk Vendors</h2>
              <div className="w-12 h-12 rounded-full bg-danger-light dark:bg-danger-light flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger dark:text-danger-color" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">3</p>
            <p className="text-sm text-danger dark:text-danger-color">Requires immediate review</p>
          </div>
          
          <div className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600 dark:text-gray-300">Trust Portal Views</h2>
              <div className="w-12 h-12 rounded-full bg-success-light dark:bg-success-light flex items-center justify-center">
                <Eye className="w-6 h-6 text-success dark:text-success-color" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 dark:text-white mb-4">127</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">+24% from last week</p>
          </div>
        </section>
        
        {/* Debug controls for testing - only visible in dev mode */}
        {isDevMode && (
          <div className="mb-6 p-4 bg-controls-bg rounded-md">
            <h2 className="text-lg font-semibold mb-2">Vendor List Testing Controls</h2>
            <div className="flex items-center gap-4">
              <button
                onClick={toggleErrorSimulation}
                className={cn(
                  "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2",
                  simulateError 
                    ? "bg-danger text-white hover:bg-danger/90 focus:ring-danger" 
                    : "bg-gray-300 text-gray-800 hover:bg-gray-400 focus:ring-gray-400 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                )}
              >
                {simulateError ? "Error Mode: ON" : "Error Mode: OFF"}
              </button>
              <button
                onClick={fetchVendors}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                Reload Vendors
              </button>
            </div>
            <p className="mt-2 text-sm">
              Use these controls to test the error handling and retry functionality of the vendor list.
            </p>
          </div>
        )}
        
        {/* Vendor Section */}
        <VendorList 
          vendors={vendors}
          className="min-h-[300px]" 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
        />
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <section className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Pending Tasks</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Complete SOC 2 gap assessment</span>
                  <span className="bg-danger-light text-danger dark:bg-danger-light dark:text-danger-color text-xs px-2 py-1 rounded-full">High</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 2 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Update vendor risk assessments</span>
                  <span className="bg-warning-light text-warning dark:bg-warning-light dark:text-warning-color text-xs px-2 py-1 rounded-full">Medium</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 5 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800 dark:text-white">Conduct security awareness training</span>
                  <span className="bg-secondary-light text-secondary dark:bg-secondary-light dark:text-secondary-color text-xs px-2 py-1 rounded-full">Low</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">Assigned to you</span>
                  <span className="text-gray-600 dark:text-gray-300">Due in 1 week</span>
                </div>
              </li>
            </ul>
          </section>
          
          {/* Recent Activity */}
          <section className="bg-white dark:bg-card-bg p-8 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Recent Activity</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-light dark:bg-secondary-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary dark:text-secondary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">Michael Rodriguez</span> uploaded a new evidence document for ISO 27001
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Today, 10:45 AM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-success-light dark:bg-success-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-success dark:text-success-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">You</span> completed the GDPR compliance assessment
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday, 3:20 PM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 dark:border-gray-700 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-light dark:bg-primary-dark flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary dark:text-primary-color" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-white">
                      <span className="font-semibold">Jennifer Wilson</span> created a new vendor questionnaire
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Yesterday, 11:35 AM</p>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
}
