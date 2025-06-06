"use client";

import React, { useState, useEffect } from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { VendorList } from "@/components/dashboard/VendorList";
import Header from "@/components/Header";
import { addVendor, saveVendor, vendorsData, getAllVendors } from "@/lib/data/vendors";
import { useRouter } from "next/navigation";
import { Vendor, VendorStatus, RiskLevel, QuestionnaireAnswer } from "@/lib/types/vendor.types";
import { v4 as uuidv4 } from 'uuid';
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

// Create a global object for our vendor functions
if (typeof window !== 'undefined') {
  (window as any).vendorQuestionnaireFunctions = {};
}

const VendorsPage = () => {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddVendorModalOpen, setIsAddVendorModalOpen] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [newVendorName, setNewVendorName] = useState<string>('');
  const [newVendorContact, setNewVendorContact] = useState<string>('');
  const [newVendorEmail, setNewVendorEmail] = useState<string>('');
  const [newVendorIndustry, setNewVendorIndustry] = useState<string>('');

  // Fetch vendors
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/vendors');
      // const data = await response.json();
      
      // For now, use our local data
      const vendorsList = getAllVendors();
      setVendors(vendorsList);
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
    
    // Setup global functions for use in other components
    if (typeof window !== 'undefined') {
      (window as any).vendorQuestionnaireFunctions = {
        saveQuestionnaireForVendor,
        createVendorWithQuestionnaire
      };
    }
  }, []);

  // Handle adding vendor modal
  const openAddVendorModal = () => {
    setIsAddVendorModalOpen(true);
  };
  
  const closeAddVendorModal = () => {
    setIsAddVendorModalOpen(false);
    // Reset form fields
    setNewVendorName('');
    setNewVendorContact('');
    setNewVendorEmail('');
    setNewVendorIndustry('');
  };
  
  // Handle add vendor form submission
  const handleAddVendor = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newVendorName.trim()) {
      setError('Vendor name is required');
      return;
    }
    
    try {
      // Create a new vendor
      const newVendor: Vendor = {
        id: uuidv4(),
        name: newVendorName,
        status: VendorStatus.QUESTIONNAIRE_PENDING,
        questionnaireAnswers: [],
        riskScore: 50,
        riskLevel: RiskLevel.MEDIUM,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      if (newVendorContact) {
        (newVendor as any).contactName = newVendorContact;
      }
      
      if (newVendorEmail) {
        (newVendor as any).contactEmail = newVendorEmail;
      }
      
      if (newVendorIndustry) {
        (newVendor as any).industry = newVendorIndustry;
      }
      
      // Add vendor
      addVendor(newVendor);
      
      // Refresh vendors list
      fetchVendors();
      
      // Close modal
      closeAddVendorModal();
    } catch (error: any) {
      console.error('Error adding vendor:', error);
      setError(`Failed to add vendor: ${error.message}`);
    }
  };

  // Save questionnaire answers for existing vendor
  const saveQuestionnaireForVendor = (vendorId: string, answers: QuestionnaireAnswer[]) => {
    try {
      // Find the vendor
      const vendor = vendors.find(v => v.id === vendorId);
      
      if (!vendor) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
      }
      
      // Update the vendor with new answers
      const updatedVendor: Vendor = {
        ...vendor,
        questionnaireAnswers: answers,
        status: VendorStatus.IN_REVIEW, // Update status as per requirement
        updatedAt: new Date()
      };
      
      // Save vendor (in a real app, this would be an API call)
      saveVendor(updatedVendor);
      
      // Refresh vendors list
      fetchVendors();
      
      return updatedVendor;
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      throw error;
    }
  };

  // Create new vendor with questionnaire answers
  const createVendorWithQuestionnaire = (
    vendorName: string,
    answers: QuestionnaireAnswer[],
    additionalData: Partial<Vendor> = {}
  ) => {
    try {
      // Create a new vendor
      const newVendor: Vendor = {
        id: uuidv4(), // Generate unique ID
        name: vendorName,
        status: VendorStatus.IN_REVIEW, // Set status to "In Review" as per requirement
        questionnaireAnswers: answers,
        riskScore: additionalData.riskScore || 50, // Default risk score
        riskLevel: additionalData.riskLevel || RiskLevel.MEDIUM, // Default risk level
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Add vendor (in a real app, this would be an API call)
      addVendor(newVendor);
      
      // Refresh vendors list
      fetchVendors();
      
      return newVendor;
    } catch (error) {
      console.error('Error creating vendor with questionnaire:', error);
      throw error;
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Filter vendors based on search query
  const filteredVendors = vendors.filter(vendor => 
    vendor.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Map our vendor type to the VendorList component's expected vendor type
  const mappedVendors = filteredVendors.map(vendor => ({
    id: vendor.id,
    name: vendor.name,
    status: vendor.status as any // Type cast to match the expected VendorList status type
  }));

  return (
    <ProtectedRoute requiredRole="vendor">
      <Header />
          
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 flex items-center">
              <Building2 className="mr-3 h-7 w-7 text-primary" />
              Vendors
            </h1>
            <p className="text-gray-600 mt-1">Manage and assess your third-party vendors</p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Search box */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                placeholder="Search vendors"
                value={searchQuery}
                onChange={handleSearch}
              />
            </div>
            
            <button 
              className="garnet-button garnet-button-gradient flex items-center"
              onClick={openAddVendorModal}
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>
        
        {/* Vendor List */}
        <VendorList 
          vendors={mappedVendors} 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
        />

        {/* Add Vendor Modal */}
        {isAddVendorModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              {/* Background overlay */}
              <div 
                className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
                aria-hidden="true"
                onClick={closeAddVendorModal}
              ></div>

              {/* Modal panel */}
              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                        Add New Vendor
                      </h3>
                      <div className="mt-4">
                        <form onSubmit={handleAddVendor}>
                          <div className="space-y-4">
                            <div>
                              <label htmlFor="vendorName" className="block text-sm font-medium text-gray-700">
                                Vendor Name *
                              </label>
                              <input 
                                type="text" 
                                id="vendorName" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={newVendorName}
                                onChange={(e) => setNewVendorName(e.target.value)}
                                required
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700">
                                Contact Name
                              </label>
                              <input 
                                type="text" 
                                id="contactName" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={newVendorContact}
                                onChange={(e) => setNewVendorContact(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
                                Contact Email
                              </label>
                              <input 
                                type="email" 
                                id="contactEmail" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={newVendorEmail}
                                onChange={(e) => setNewVendorEmail(e.target.value)}
                              />
                            </div>
                            
                            <div>
                              <label htmlFor="industry" className="block text-sm font-medium text-gray-700">
                                Industry
                              </label>
                              <input 
                                type="text" 
                                id="industry" 
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                value={newVendorIndustry}
                                onChange={(e) => setNewVendorIndustry(e.target.value)}
                              />
                            </div>
                          </div>
                          
                          <div className="mt-6 flex justify-end space-x-3">
                            <button
                              type="button"
                              className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              onClick={closeAddVendorModal}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              Add Vendor
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </ProtectedRoute>
  );
};

export default VendorsPage; 