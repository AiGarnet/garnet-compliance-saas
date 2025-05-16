"use client";

import React from "react";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";

const QuestionnairesPage = () => {
  // Sample data for demonstration
  const questionnaires = [
    { id: "q1", name: "SOC 2 Type II Assessment", status: "In Progress", dueDate: "Aug 15, 2023", progress: 65 },
    { id: "q2", name: "GDPR Compliance Questionnaire", status: "Completed", dueDate: "Jul 28, 2023", progress: 100 },
    { id: "q3", name: "ISO 27001 Readiness Assessment", status: "Not Started", dueDate: "Sep 10, 2023", progress: 0 },
    { id: "q4", name: "HIPAA Security Assessment", status: "In Review", dueDate: "Aug 5, 2023", progress: 85 },
    { id: "q5", name: "Vendor Security Assessment", status: "Draft", dueDate: "Sep 30, 2023", progress: 20 },
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
            <a href="/questionnaires" className="text-primary font-medium min-h-[44px] flex items-center border-b-2 border-primary">
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
              <ClipboardList className="mr-3 h-7 w-7 text-primary" />
              Questionnaires
            </h1>
            <p className="text-gray-600 mt-1">Manage and track all your compliance questionnaires</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="search" 
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder="Search questionnaires..."
              />
            </div>
            <button className="text-gray-600 hover:text-gray-800 p-2 rounded-md border border-gray-300 hover:border-gray-400 transition-colors">
              <Filter className="h-5 w-5" />
            </button>
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              New Questionnaire
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
              <option value="">All Types</option>
              <option value="soc2">SOC 2</option>
              <option value="iso27001">ISO 27001</option>
              <option value="gdpr">GDPR</option>
              <option value="hipaa">HIPAA</option>
            </select>
            
            <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
              <option value="">All Status</option>
              <option value="not-started">Not Started</option>
              <option value="in-progress">In Progress</option>
              <option value="in-review">In Review</option>
              <option value="completed">Completed</option>
            </select>
            
            <select className="border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none">
              <option value="">All Due Dates</option>
              <option value="overdue">Overdue</option>
              <option value="this-week">Due This Week</option>
              <option value="next-week">Due Next Week</option>
              <option value="this-month">Due This Month</option>
            </select>
          </div>
        </div>
        
        {/* Questionnaires List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Name</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Status</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Due Date</th>
                <th className="px-6 py-4 text-left text-sm font-medium text-gray-600">Progress</th>
                <th className="px-6 py-4 text-sm font-medium text-gray-600">Actions</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-200">
              {questionnaires.map(questionnaire => (
                <tr key={questionnaire.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium text-gray-800">{questionnaire.name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      questionnaire.status === 'Completed' ? 'bg-success-light text-success' :
                      questionnaire.status === 'In Progress' ? 'bg-primary-light text-primary' :
                      questionnaire.status === 'In Review' ? 'bg-secondary-light text-secondary' :
                      questionnaire.status === 'Draft' ? 'bg-warning-light text-warning' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {questionnaire.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {questionnaire.dueDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div 
                        className={`h-2.5 rounded-full ${
                          questionnaire.progress === 100 ? 'bg-success' :
                          questionnaire.progress > 75 ? 'bg-secondary' :
                          questionnaire.progress > 30 ? 'bg-primary' :
                          questionnaire.progress > 0 ? 'bg-warning' : 'bg-gray-300'
                        }`}
                        style={{ width: `${questionnaire.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500 mt-1 block">{questionnaire.progress}%</span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button className="text-primary hover:text-primary/80 transition-colors">Edit</button>
                      <button className="text-gray-600 hover:text-gray-800 transition-colors">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
};

export default QuestionnairesPage; 