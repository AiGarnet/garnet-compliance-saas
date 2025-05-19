"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Eye, PlusCircle, LogOut, User } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ComplianceCard } from "@/components/dashboard/ComplianceCard";
import { QuestionnaireCard } from "@/components/dashboard/QuestionnaireCard";
import { VendorList, Vendor, VendorStatus } from "@/components/dashboard/VendorList";
import { MobileNavigation } from "@/components/MobileNavigation";
import { cn } from "@/lib/utils";

// Vendor data
const mockVendors = [
  { id: "1", name: "Acme Corp", status: "Questionnaire Pending" as VendorStatus },
  { id: "2", name: "Globex Ltd", status: "In Review" as VendorStatus },
  { id: "3", name: "Stark Industries", status: "Approved" as VendorStatus },
  { id: "4", name: "Wayne Enterprises", status: "Questionnaire Pending" as VendorStatus },
  { id: "5", name: "Oscorp Industries", status: "In Review" as VendorStatus },
  { id: "6", name: "Umbrella Corporation", status: "Approved" as VendorStatus },
];

const DashboardPage = () => {
  const [vendorList, setVendorList] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Simulate API fetch with delay and potential error
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncomment to simulate error
      // if (Math.random() > 0.7) throw new Error("Failed to fetch vendors");
      
      setVendorList(mockVendors);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching vendors:", err);
      setError('Unable to load vendors. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchVendors();
  }, []);

  return (
    <>
      <header 
        role="banner" 
        className="sticky top-0 z-10 flex items-center justify-between bg-white shadow-sm px-6 py-3"
      >
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-8">Vendor Onboarding</h1>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-primary font-medium min-h-[44px] flex items-center border-b-2 border-primary">
              Dashboard
            </a>
            <a href="/questionnaires" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Questionnaires
            </a>
            <a href="/vendors" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Vendors
            </a>
            <a href="/trust-portal" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Trust Portal
            </a>
            <a href="/compliance" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Compliance
            </a>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          <MobileNavigation />
          
          <button 
            className="text-gray-600 hover:text-black flex items-center min-h-[44px] min-w-[44px] px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md" 
            disabled
            aria-label="User profile (not functional)"
          >
            <User className="h-5 w-5 mr-2" />
            <span className="hidden md:inline">Profile</span>
          </button>
          
          <button 
            className="text-gray-600 hover:text-black flex items-center min-h-[44px] min-w-[44px] px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md" 
            disabled
            aria-label="Logout button (not functional)"
          >
            <LogOut className="h-5 w-5 md:mr-2" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8">
        {/* Welcome Section */}
        <section className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Sarah</h1>
          <p className="text-gray-600">Here's an overview of your compliance status</p>
        </section>
        
        {/* Stat Cards */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <ComplianceCard percentage={78} change="+12% from last month" />
          
          <QuestionnaireCard count={5} dueSoon="2 due this week" />
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600">High-Risk Vendors</h2>
              <div className="w-12 h-12 rounded-full bg-danger-light flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-danger" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 mb-4">3</p>
            <p className="text-sm text-danger">Requires immediate review</p>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-base font-medium text-gray-600">Trust Portal Views</h2>
              <div className="w-12 h-12 rounded-full bg-success-light flex items-center justify-center">
                <Eye className="w-6 h-6 text-success" />
              </div>
            </div>
            <p className="text-4xl font-semibold text-gray-800 mb-4">127</p>
            <p className="text-sm text-gray-500">+24% from last week</p>
          </div>
        </section>
        
        {/* Vendor Section */}
        <VendorList 
          vendors={vendorList} 
          className="min-h-[300px]" 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
        />
        
        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Pending Tasks</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800">Complete SOC 2 gap assessment</span>
                  <span className="bg-danger-light text-danger text-xs px-2 py-1 rounded-full">High</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned to you</span>
                  <span className="text-gray-600">Due in 2 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800">Update vendor risk assessments</span>
                  <span className="bg-warning-light text-warning text-xs px-2 py-1 rounded-full">Medium</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned to you</span>
                  <span className="text-gray-600">Due in 5 days</span>
                </div>
              </li>
              
              <li className="border-b border-gray-100 pb-4">
                <div className="flex justify-between mb-2">
                  <span className="font-medium text-gray-800">Conduct security awareness training</span>
                  <span className="bg-secondary-light text-secondary text-xs px-2 py-1 rounded-full">Low</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Assigned to you</span>
                  <span className="text-gray-600">Due in 1 week</span>
                </div>
              </li>
            </ul>
          </section>
          
          {/* Recent Activity */}
          <section className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
              <a href="#" className="text-sm text-primary font-medium hover:text-primary/80 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md px-2 py-1">
                View All
              </a>
            </div>
            
            <ul className="space-y-4" role="list">
              <li className="border-b border-gray-100 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-secondary-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-semibold">Michael Rodriguez</span> uploaded a new evidence document for ISO 27001
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Today, 10:45 AM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-success-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-semibold">You</span> completed the GDPR compliance assessment
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Yesterday, 3:20 PM</p>
                  </div>
                </div>
              </li>
              
              <li className="border-b border-gray-100 pb-4">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center mr-3 flex-shrink-0">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      <span className="font-semibold">Jennifer Wilson</span> created a new vendor questionnaire
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Yesterday, 11:35 AM</p>
                  </div>
                </div>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </>
  );
};

export default DashboardPage;
