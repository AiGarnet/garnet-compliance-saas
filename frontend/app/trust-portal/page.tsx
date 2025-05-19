"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, Lock, Shield, ShieldCheck, User } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { ComplianceReportList, ComplianceReport } from "@/components/dashboard/ComplianceReportList";

const TrustPortalPage = () => {
  // Sample data for demonstration
  const mockReports = [
    { 
      id: "r1", 
      name: "SOC 2 Type II Report", 
      date: "July 2023",
      description: "Independent assessment of our controls relevant to security, availability, and confidentiality.",
      fileSize: "3.2 MB",
      fileType: "PDF",
      category: "Certification" as const
    },
    { 
      id: "r2", 
      name: "ISO 27001 Certificate", 
      date: "March 2023",
      description: "Certification for our Information Security Management System (ISMS).",
      fileSize: "1.5 MB",
      fileType: "PDF",
      category: "Certification" as const
    },
    { 
      id: "r3", 
      name: "GDPR Compliance Statement", 
      date: "May 2023",
      description: "Details of our compliance with the General Data Protection Regulation.",
      fileSize: "845 KB",
      fileType: "PDF",
      category: "Statement" as const
    },
    { 
      id: "r4", 
      name: "Privacy Policy", 
      date: "June 2023",
      description: "Our policy regarding the collection, use, and disclosure of personal information.",
      fileSize: "720 KB",
      fileType: "PDF",
      category: "Policy" as const
    },
  ];

  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Simulate API fetch with delay and potential error
  const fetchReports = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncomment to simulate error
      // if (Math.random() > 0.7) throw new Error("Failed to fetch reports");
      
      setReports(mockReports);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching compliance reports:", err);
      setError('Unable to load compliance reports. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchReports();
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
            <a href="/dashboard" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Dashboard
            </a>
            <a href="/questionnaires" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Questionnaires
            </a>
            <a href="/vendors" className="text-gray-600 hover:text-primary min-h-[44px] flex items-center transition-colors">
              Vendors
            </a>
            <a href="/trust-portal" className="text-primary font-medium min-h-[44px] flex items-center border-b-2 border-primary">
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
            <svg className="h-5 w-5 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </header>
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-primary/90 to-secondary/90 text-white rounded-2xl p-8 md:p-12">
          <div className="max-w-3xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4 flex items-center">
              <Shield className="mr-4 h-10 w-10" />
              Trust Center
            </h1>
            <p className="text-lg md:text-xl opacity-90 mb-6">
              Your transparency hub for security, compliance, and data privacy information.
            </p>
            <p className="opacity-80 mb-8 max-w-2xl">
              We're committed to being transparent about our security and compliance practices. 
              Here you'll find our latest compliance reports, security documentation, and policies.
            </p>
            
            <div className="flex flex-wrap gap-4 mt-6">
              <a href="#compliance" className="bg-white text-primary hover:bg-gray-100 px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                View Compliance Reports
              </a>
              <a href="#security" className="bg-white/20 text-white hover:bg-white/30 px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                <Lock className="mr-2 h-5 w-5" />
                Learn About Our Security
              </a>
            </div>
          </div>
        </section>
        
        {/* Compliance Reports Section */}
        <section id="compliance" className="pt-8">
          <ComplianceReportList
            reports={reports}
            isLoading={isLoading}
            error={error}
            onRetry={fetchReports}
          />
        </section>
        
        {/* Security Practices Section */}
        <section id="security" className="pt-12 pb-8">
          <div className="flex items-center mb-8">
            <Lock className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800">Security Practices</h2>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Data Encryption</h3>
                <p className="text-gray-600 mb-4">
                  We implement industry-standard encryption protocols to protect your sensitive data in transit and at rest.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">TLS 1.2+ for all data in transit</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">AES-256 encryption for data at rest</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Secure key management practices</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Access Controls</h3>
                <p className="text-gray-600 mb-4">
                  We employ strict access controls to ensure only authorized personnel can access sensitive systems and data.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Multi-factor authentication (MFA)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Least privilege principle</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 border-t border-gray-200">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Infrastructure Security</h3>
                <p className="text-gray-600 mb-4">
                  Our infrastructure is designed with multiple layers of security to protect against threats.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">DDoS protection</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Web Application Firewall (WAF)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Network segregation</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-4">Monitoring & Incident Response</h3>
                <p className="text-gray-600 mb-4">
                  We continuously monitor our systems and have robust procedures for responding to security incidents.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">24/7 security monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Incident response team</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">Regular security testing</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default TrustPortalPage; 