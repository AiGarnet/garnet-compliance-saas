"use client";

import React, { useState, useEffect } from "react";
import { ClipboardList, Filter, Plus, Search, SlidersHorizontal } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { QuestionnaireList, Questionnaire, QuestionnaireStatus } from "@/components/dashboard/QuestionnaireList";

const QuestionnairesPage = () => {
  // Sample data for demonstration
  const mockQuestionnaires = [
    { id: "q1", name: "SOC 2 Type II Assessment", status: "In Progress" as QuestionnaireStatus, dueDate: "Aug 15, 2023", progress: 65 },
    { id: "q2", name: "GDPR Compliance Questionnaire", status: "Completed" as QuestionnaireStatus, dueDate: "Jul 28, 2023", progress: 100 },
    { id: "q3", name: "ISO 27001 Readiness Assessment", status: "Not Started" as QuestionnaireStatus, dueDate: "Sep 10, 2023", progress: 0 },
    { id: "q4", name: "HIPAA Security Assessment", status: "In Review" as QuestionnaireStatus, dueDate: "Aug 5, 2023", progress: 85 },
    { id: "q5", name: "Vendor Security Assessment", status: "Draft" as QuestionnaireStatus, dueDate: "Sep 30, 2023", progress: 20 },
  ];
  
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  // Simulate API fetch with delay and potential error
  const fetchQuestionnaires = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Uncomment to simulate error
      // if (Math.random() > 0.7) throw new Error("Failed to fetch questionnaires");
      
      setQuestionnaires(mockQuestionnaires);
      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching questionnaires:", err);
      setError('Unable to load questionnaires. Please try again.');
      setIsLoading(false);
    }
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchQuestionnaires();
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
          
          <div className="flex items-center">
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              New Questionnaire
            </button>
          </div>
        </div>
        
        {/* Questionnaire List Component */}
        <QuestionnaireList 
          questionnaires={questionnaires} 
          isLoading={isLoading}
          error={error}
          onRetry={fetchQuestionnaires}
        />
      </main>
    </>
  );
};

export default QuestionnairesPage; 