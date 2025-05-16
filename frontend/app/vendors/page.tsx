"use client";

import React from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";

const VendorsPage = () => {
  // Sample data for demonstration
  const vendors = [
    { 
      id: "v1", 
      name: "CloudSecure Inc.", 
      category: "Infrastructure", 
      riskLevel: "Medium", 
      status: "Active", 
      contacts: 3,
      lastAssessment: "Jul 15, 2023",
      complianceScore: 82
    },
    { 
      id: "v2", 
      name: "DataGuard Solutions", 
      category: "Data Processing", 
      riskLevel: "High", 
      status: "Pending Review", 
      contacts: 2,
      lastAssessment: "Jun 28, 2023",
      complianceScore: 65
    },
    { 
      id: "v3", 
      name: "SecureNet Systems", 
      category: "Software", 
      riskLevel: "Low", 
      status: "Active", 
      contacts: 4,
      lastAssessment: "Aug 10, 2023",
      complianceScore: 95
    },
    { 
      id: "v4", 
      name: "TechShield Partners", 
      category: "Security", 
      riskLevel: "Medium", 
      status: "Active", 
      contacts: 1,
      lastAssessment: "Jul 05, 2023",
      complianceScore: 78
    },
    { 
      id: "v5", 
      name: "DataVault Cloud", 
      category: "Storage", 
      riskLevel: "High", 
      status: "Needs Attention", 
      contacts: 2,
      lastAssessment: "Jun 20, 2023",
      complianceScore: 58
    },
  ];

  return (
    <>
      <header 
        role="banner" 
        className="sticky top-0 z-10 flex items-center justify-between bg-white shadow-sm px-6 py-3"
      >
        <div className="flex items-center">
          <h1 className="text-xl font-semibold mr-8">Vendor Onboarding</h1>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Dashboard
            </a>
            <a href="/questionnaires" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Questionnaires
            </a>
            <a href="/vendors" className="text-primary font-medium min-h-[44px] flex items-center border-b-2 border-primary">
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
            <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
            <span className="hidden md:inline">Profile</span>
          </button>
          
          <button 
            className="text-gray-600 hover:text-black flex items-center min-h-[44px] min-w-[44px] px-3 focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-md" 
            disabled
            aria-label="Logout button (not functional)"
          >
            <svg className="h-5 w-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Building2 className="mr-3 h-7 w-7 text-primary" />
              Vendors
            </h1>
            <p className="text-gray-600 mt-1">Manage and assess your third-party vendors</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="search" 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="Search vendors..."
              />
            </div>
            <button className="text-gray-600 hover:text-gray-800 p-2 rounded-md border border-gray-300 hover:border-gray-400 transition-colors">
              <Filter className="h-5 w-5" />
            </button>
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 flex flex-col md:flex-row gap-4 border border-gray-200">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-700">Filters:</span>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
              <option value="">All Categories</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="security">Security</option>
              <option value="software">Software</option>
              <option value="data-processing">Data Processing</option>
            </select>
            
            <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
              <option value="">All Risk Levels</option>
              <option value="high">High Risk</option>
              <option value="medium">Medium Risk</option>
              <option value="low">Low Risk</option>
            </select>
            
            <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending Review</option>
              <option value="attention">Needs Attention</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
        
        {/* Vendors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map(vendor => (
            <div key={vendor.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{vendor.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  vendor.riskLevel === 'Low' ? 'bg-success-light text-success' :
                  vendor.riskLevel === 'Medium' ? 'bg-warning-light text-warning' :
                  'bg-danger-light text-danger'
                }`}>
                  {vendor.riskLevel} Risk
                </span>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Category:</span> {vendor.category}
                </p>
                <p className="text-sm text-gray-600 mb-1">
                  <span className="font-medium">Status:</span> 
                  <span className={`ml-1 ${
                    vendor.status === 'Active' ? 'text-success' :
                    vendor.status === 'Needs Attention' ? 'text-danger' :
                    'text-gray-500'
                  }`}>
                    {vendor.status}
                  </span>
                </p>
                <p className="text-sm text-gray-600 mb-1 flex items-center">
                  <span className="font-medium">Contacts:</span> 
                  <span className="ml-1 flex items-center">
                    {vendor.contacts}
                    <Users className="h-4 w-4 ml-1 text-gray-400" />
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Last Assessment:</span> {vendor.lastAssessment}
                </p>
              </div>
              
              <div className="mt-auto">
                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-600">Compliance Score</span>
                    <span className={`text-sm font-medium ${
                      vendor.complianceScore >= 90 ? 'text-success' :
                      vendor.complianceScore >= 70 ? 'text-warning' :
                      'text-danger'
                    }`}>
                      {vendor.complianceScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        vendor.complianceScore >= 90 ? 'bg-success' :
                        vendor.complianceScore >= 70 ? 'bg-warning' :
                        'bg-danger'
                      }`}
                      style={{ width: `${vendor.complianceScore}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100">
                  <a href={`/vendors/${vendor.id}`} className="text-primary hover:text-primary/80 font-medium text-sm">
                    View Details
                  </a>
                  <button className="text-gray-500 hover:text-gray-700 text-sm flex items-center">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Send Assessment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
};

export default VendorsPage; 