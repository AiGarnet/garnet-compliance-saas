"use client";

import React, { useState, useEffect } from "react";
import { Download, ExternalLink, Lock, Shield, ShieldCheck, User, AlertCircle } from "lucide-react";
import { ComplianceReportList, ComplianceReport } from "@/components/dashboard/ComplianceReportList";
import Header from "@/components/Header";

const TrustPortalPage = () => {
  const [reports, setReports] = useState<ComplianceReport[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingVendors, setIsLoadingVendors] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [vendors, setVendors] = useState<{ id: string; name: string; companyName?: string }[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);

  // Railway backend URL - Updated to correct URL
  const BACKEND_URL = 'https://garnet-compliance-saas-production.up.railway.app';

  useEffect(() => {
    fetchVendors();
  }, []);

  useEffect(() => {
    if (selectedVendorId) {
      fetchReports();
    }
  }, [selectedVendorId]);

  const fetchVendors = async () => {
    setIsLoadingVendors(true);
    setError('');
    
    try {
      const response = await fetch(`${BACKEND_URL}/api/vendors`);
      if (!response.ok) throw new Error('Failed to fetch vendors');
      const data = await response.json();
      
      // Transform the data to match our interface
      const transformedVendors = data.map((vendor: any) => ({
        id: vendor.id || vendor.vendorId?.toString() || vendor.uuid,
        name: vendor.name || vendor.companyName || vendor.company_name,
        companyName: vendor.companyName || vendor.company_name || vendor.name
      }));
      
      setVendors(transformedVendors);
      if (transformedVendors.length > 0) {
        setSelectedVendorId(transformedVendors[0].id);
      }
    } catch (err) {
      setError('Failed to load vendors from backend');
      console.error('Error fetching vendors:', err);
    } finally {
      setIsLoadingVendors(false);
    }
  };

  const fetchReports = async () => {
    if (!selectedVendorId) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      // First try to get trust portal items (if implemented)
      let trustPortalItems = [];
      try {
        const trustPortalResponse = await fetch(`${BACKEND_URL}/api/trust-portal/items?vendorId=${selectedVendorId}`);
        if (trustPortalResponse.ok) {
          trustPortalItems = await trustPortalResponse.json();
        }
      } catch (trustPortalError) {
        console.log('Trust portal endpoint not available yet, will show questionnaire data');
      }

      // Get vendor details including questionnaire answers
      const vendorResponse = await fetch(`${BACKEND_URL}/api/vendors/${selectedVendorId}`);
      if (!vendorResponse.ok) throw new Error('Failed to fetch vendor details');
      const vendorData = await vendorResponse.json();

      // Transform questionnaire answers to compliance reports format
      const questionnaireReports = (vendorData.questionnaireAnswers || []).map((qa: any, index: number) => ({
        id: `qa-${index}`,
        name: qa.question,
        date: new Date(qa.createdAt || Date.now()).toLocaleDateString(),
        description: qa.answer,
        fileSize: "N/A",
        fileType: "Questionnaire Answer",
        category: "Questionnaire" as const
      }));

      // Transform trust portal items to compliance reports format
      const trustPortalReports = trustPortalItems.map((item: any) => ({
        id: item.id.toString(),
        name: item.title,
        date: new Date(item.createdAt).toLocaleDateString(),
        description: item.description || '',
        fileSize: item.fileSize || "N/A",
        fileType: item.fileType || "Document",
        category: item.category as any
      }));

      const allReports = [...questionnaireReports, ...trustPortalReports];
      setReports(allReports);
    } catch (err) {
      setError('Failed to load vendor data');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const EmptyState = () => (
    <div className="text-center py-12">
      <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        No Compliance Data Yet
      </h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">
        This vendor hasn't started their compliance questionnaire or uploaded any evidence files yet.
      </p>
      <p className="text-sm text-gray-500 dark:text-gray-500">
        Once they begin the process, their compliance reports and documentation will appear here.
      </p>
    </div>
  );

  return (
    <>
      <Header />
      
      <main id="main-content" className="flex flex-col gap-8 px-4 md:px-8 py-8 bg-body-bg dark:bg-body-bg">
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
              <a href="#compliance" className="bg-white dark:bg-gray-800 text-primary hover:bg-gray-100 dark:hover:bg-gray-700 px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                <ShieldCheck className="h-5 w-5 mr-2" />
                Compliance
              </a>
              <a href="#security" className="bg-white/20 text-white hover:bg-white/30 dark:hover:bg-gray-700/40 px-6 py-3 rounded-lg font-medium transition-colors flex items-center">
                <Lock className="h-5 w-5 mr-2" />
                Security
              </a>
            </div>
          </div>
        </section>

        {/* Vendor Selection */}
        <div className="mt-8 mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select Vendor
          </label>
          {isLoadingVendors ? (
            <div className="w-full md:w-[300px] h-10 bg-gray-200 animate-pulse rounded-md"></div>
          ) : vendors.length > 0 ? (
            <select
              value={selectedVendorId || ''}
              onChange={(e) => setSelectedVendorId(e.target.value)}
              className="w-full md:w-[300px] h-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a vendor</option>
              {vendors.map((vendor) => (
                <option key={vendor.id} value={vendor.id}>
                  {vendor.name || vendor.companyName}
                </option>
              ))}
            </select>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">
              No vendors found. Please add vendors to the system first.
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}
        
        {/* Compliance Reports Section */}
        <section id="compliance" className="pt-8">
          {selectedVendorId ? (
            reports.length > 0 || isLoading ? (
              <ComplianceReportList
                reports={reports}
                isLoading={isLoading}
                error={error}
                onRetry={fetchReports}
              />
            ) : (
              <div className="bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-6">
                <EmptyState />
              </div>
            )
          ) : (
            <div className="bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border p-6">
              <div className="text-center py-8">
                <p className="text-gray-500 dark:text-gray-400">
                  Please select a vendor to view their compliance information.
                </p>
              </div>
            </div>
          )}
        </section>
        
        {/* Security Practices Section */}
        <section id="security" className="pt-12 pb-8">
          <div className="flex items-center mb-8">
            <Lock className="h-7 w-7 text-primary mr-3" />
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Security Practices</h2>
          </div>
          
          <div className="bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border overflow-hidden">
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Data Encryption</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We implement industry-standard encryption protocols to protect your sensitive data in transit and at rest.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">TLS 1.2+ for all data in transit</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">AES-256 encryption for data at rest</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Secure key management practices</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Access Controls</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We employ strict access controls to ensure only authorized personnel can access sensitive systems and data.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Role-based access control (RBAC)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Multi-factor authentication (MFA)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Least privilege principle</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200 dark:divide-gray-700 border-t border-gray-200 dark:border-gray-700">
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Infrastructure Security</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Our infrastructure is designed with multiple layers of security to protect against threats.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">DDoS protection</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Web Application Firewall (WAF)</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Network segregation</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">Monitoring & Incident Response</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  We continuously monitor our systems and have robust procedures for responding to security incidents.
                </p>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">24/7 security monitoring</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Incident response team</span>
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-success dark:text-success-color mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600 dark:text-gray-300">Regular security testing</span>
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