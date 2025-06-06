"use client";

import React, { useState, useEffect } from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { VendorList } from "@/components/dashboard/VendorList";
import { Vendor, VendorFormData } from "@/types/vendor";
import { vendors as vendorAPI } from "@/lib/api";
import Header from "@/components/Header";
import { AddVendorModal } from "../../components/vendors/AddVendorModal";

const VendorsPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Fetch vendors from API
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      const response = await vendorAPI.getAll();
      setVendors(response.vendors || []);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching vendors:", err);
      setError(err.message || 'Unable to load vendors. Please try again.');
      setIsLoading(false);
    }
  };

  // Handle adding a new vendor
  const handleAddVendor = async (vendorData: VendorFormData) => {
    try {
      const response = await vendorAPI.create(vendorData);
      setVendors(prev => [...prev, response.vendor]);
      setIsAddModalOpen(false);
    } catch (err: any) {
      console.error("Error creating vendor:", err);
      throw new Error(err.message || 'Failed to create vendor');
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
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-primary text-white hover:bg-primary/90 px-4 py-2 rounded-md flex items-center transition-colors"
            >
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

        {/* Add Vendor Modal */}
        <AddVendorModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSubmit={handleAddVendor}
        />
      </main>
    </>
  );
};

export default VendorsPage; 