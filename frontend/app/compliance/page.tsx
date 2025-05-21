"use client";

import React, { useState, useEffect } from "react";
import { BarChart3, CheckSquare, Download, FileText, Plus, Search, ShieldCheck, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { FrameworkList, Framework, FrameworkStatus } from "@/components/dashboard/FrameworkList";
import Header from "@/components/Header";

const CompliancePage = () => {
  // Sample data for compliance frameworks
  const mockFrameworks = [
    { 
      id: "f1", 
      name: "SOC 2", 
      progress: 78, 
      totalControls: 116,
      completedControls: 91,
      status: "In Progress" as FrameworkStatus,
      lastUpdated: "Aug 10, 2023"
    },
    { 
      id: "f2", 
      name: "ISO 27001", 
      progress: 65, 
      totalControls: 93,
      completedControls: 61,
      status: "In Progress" as FrameworkStatus,
      lastUpdated: "Jul 28, 2023"
    },
    { 
      id: "f3", 
      name: "GDPR", 
      progress: 92, 
      totalControls: 42,
      completedControls: 39,
      status: "Near Completion" as FrameworkStatus,
      lastUpdated: "Aug 15, 2023"
    },
    { 
      id: "f4", 
      name: "HIPAA", 
      progress: 100, 
      totalControls: 75,
      completedControls: 75,
      status: "Completed" as FrameworkStatus,
      lastUpdated: "Jun 30, 2023"
    },
  ];

  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Simulate API fetch with delay and potential error
  const fetchFrameworks = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncomment to simulate error
      // if (Math.random() > 0.7) throw new Error("Failed to fetch frameworks");
      
      setFrameworks(mockFrameworks);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching frameworks:", err);
      setError('Unable to load compliance frameworks. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchFrameworks();
  }, []);

  // Sample evidence data
  const evidenceItems = [
    {
      id: "e1",
      name: "Security Policy Document",
      framework: "SOC 2, ISO 27001",
      uploadDate: "Aug 15, 2023",
      uploadedBy: "Sarah Adams"
    },
    {
      id: "e2",
      name: "Vulnerability Scan Report - Q2 2023",
      framework: "SOC 2, HIPAA",
      uploadDate: "Jul 12, 2023",
      uploadedBy: "Michael Rodriguez"
    },
    {
      id: "e3",
      name: "Employee Training Records",
      framework: "ISO 27001, GDPR",
      uploadDate: "Aug 5, 2023",
      uploadedBy: "Jennifer Wilson"
    },
    {
      id: "e4",
      name: "Data Processing Agreement",
      framework: "GDPR",
      uploadDate: "Jul 28, 2023",
      uploadedBy: "Daniel Taylor"
    },
  ];

  return (
    <>
      <Header />
      
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <ShieldCheck className="mr-3 h-7 w-7 text-primary" />
              Compliance
            </h1>
            <p className="text-gray-600 mt-1">Manage your compliance programs and frameworks</p>
          </div>
          
          <div className="flex items-center">
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add Framework
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-600 font-medium flex items-center">
                <BarChart3 className="mr-2 h-5 w-5 text-primary" />
                Overall Compliance
              </h3>
              <span className="text-lg font-semibold text-primary">83%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-indigo-500 dark:bg-primary h-2.5 rounded-full" style={{ width: '83%' }}></div>
            </div>
            <p className="text-sm text-gray-500">Across all compliance frameworks</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-600 font-medium flex items-center">
                <CheckSquare className="mr-2 h-5 w-5 text-success" />
                Controls
              </h3>
              <span className="text-lg font-semibold text-success">266/326</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-emerald-500 dark:bg-success h-2.5 rounded-full" style={{ width: '81%' }}></div>
            </div>
            <p className="text-sm text-gray-500">Controls implemented across frameworks</p>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-gray-600 font-medium flex items-center">
                <FileText className="mr-2 h-5 w-5 text-secondary" />
                Evidence Items
              </h3>
              <span className="text-lg font-semibold text-secondary">42</span>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500">Supporting documents uploaded</p>
              <a href="#evidence" className="text-sm text-primary hover:text-primary/80 font-medium">View All</a>
            </div>
          </div>
        </div>
        
        {/* Compliance Frameworks */}
        <FrameworkList 
          frameworks={frameworks} 
          isLoading={isLoading}
          error={error}
          onRetry={fetchFrameworks}
        />
        
        {/* Recent Evidence */}
        <section id="evidence" className="pt-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Evidence</h2>
            <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              <Plus className="h-4 w-4 mr-1" />
              Upload Evidence
            </button>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Related To</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Uploaded By</th>
                  <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Date</th>
                  <th className="px-6 py-4 text-right text-sm font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              
              <tbody className="divide-y divide-gray-200">
                {evidenceItems.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start">
                        <FileText className="h-5 w-5 text-gray-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="font-medium text-gray-800">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.framework}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center">
                        <div className="h-6 w-6 rounded-full bg-primary-light flex items-center justify-center mr-2">
                          <Users className="h-3 w-3 text-primary" />
                        </div>
                        <span className="text-gray-600">{item.uploadedBy}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {item.uploadDate}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-primary hover:text-primary/80 font-medium text-sm flex items-center ml-auto">
                        <Download className="h-4 w-4 mr-1" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="flex justify-center mt-6">
            <button className="text-gray-600 hover:text-gray-800 text-sm font-medium py-2 px-4 border border-gray-200 rounded-md">
              View All Evidence
            </button>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* SOC 2 Card */}
          <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">SOC 2 Type II</h3>
              <span className="bg-success-light dark:bg-success-light/30 text-success px-2 py-1 text-xs rounded-full">Certified</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">Our platform has achieved SOC 2 Type II attestation, validating our security, availability, and confidentiality controls.</p>
            <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              View Certificate
            </button>
          </div>
          
          {/* ISO 27001 Card */}
          <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">ISO 27001</h3>
              <span className="bg-warning-light dark:bg-warning-light/30 text-warning px-2 py-1 text-xs rounded-full">In Progress</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">We're in the process of obtaining ISO 27001 certification. Our gap assessment and implementation of required controls is underway.</p>
            <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              View Roadmap
            </button>
          </div>
          
          {/* GDPR Card */}
          <div className="bg-white dark:bg-card-bg p-6 rounded-xl shadow-sm border border-gray-200 dark:border-card-border">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">GDPR Compliance</h3>
              <span className="bg-success-light dark:bg-success-light/30 text-success px-2 py-1 text-xs rounded-full">Compliant</span>
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">We adhere to GDPR requirements for data protection and privacy, ensuring lawful and transparent processing of personal data.</p>
            <button className="text-primary hover:text-primary/80 text-sm font-medium flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Privacy Policy
            </button>
          </div>
        </div>
        
        {/* Data Processing Agreements */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-6">Data Processing Agreements</h2>
          <div className="bg-white dark:bg-card-bg rounded-xl shadow-sm border border-gray-200 dark:border-card-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 border-b border-gray-200 dark:bg-gray-800">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-white">Name</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-white">Related To</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-white">Uploaded By</th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-600 dark:text-white">Date</th>
                    <th className="px-6 py-4 text-right text-sm font-medium text-gray-600 dark:text-white">Actions</th>
                  </tr>
                </thead>
                
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {evidenceItems.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                        {item.framework}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                        <div className="flex items-center">
                          <div className="h-6 w-6 rounded-full bg-primary-light dark:bg-primary-light flex items-center justify-center mr-2">
                            <Users className="h-3 w-3 text-primary dark:text-primary" />
                          </div>
                          <span className="text-gray-600 dark:text-white">{item.uploadedBy}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-white">
                        {item.uploadDate}
                      </td>
                      <td className="px-6 py-4 text-right text-sm text-gray-600 dark:text-white">
                        <button className="text-primary hover:text-primary/80 font-medium text-sm flex items-center ml-auto">
                          <Download className="h-4 w-4 mr-1" />
                          Download
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default CompliancePage; 