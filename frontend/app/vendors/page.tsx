"use client";

import React, { useState, useEffect } from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { VendorList, Vendor, VendorStatus } from "@/components/dashboard/VendorList";
import Header from "@/components/Header";

const VendorsPage = () => {
  // Sample data for demonstration
  const mockVendors = [
    { id: "1", name: "Acme Payments", status: "Questionnaire Pending" as VendorStatus },
    { id: "2", name: "TechSecure Solutions", status: "In Review" as VendorStatus },
    { id: "3", name: "Global Data Services", status: "Approved" as VendorStatus },
    { id: "4", name: "SecureCloud Inc", status: "Questionnaire Pending" as VendorStatus },
    { id: "5", name: "Oscorp Industries", status: "In Review" as VendorStatus },
    { id: "6", name: "Umbrella Corporation", status: "Approved" as VendorStatus },
  ];
  
  const [vendors, setVendors] = useState<Vendor[]>([]);
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
      
      setVendors(mockVendors);
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
      <Header />
          
      <main id="main-content" className="container mx-auto py-8 px-4">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-gray-800 flex items-center">
              <Building2 className="mr-3 h-7 w-7 text-primary" />
              Vendors
            </h1>
            <p className="text-gray-600 mt-1">Manage and assess your third-party vendors</p>
          </div>
          
          <div className="flex items-center">
            <button className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors">
              <Plus className="h-5 w-5 mr-2" />
              Add Vendor
            </button>
          </div>
        </div>
        
        {/* Vendor List */}
        <VendorList 
          vendors={vendors} 
          isLoading={isLoading}
          error={error}
          onRetry={fetchVendors}
        />
      </main>
    </>
  );
};

export default VendorsPage; 