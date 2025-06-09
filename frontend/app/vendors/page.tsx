"use client";

import React, { useState, useEffect } from "react";
import { Building2, ExternalLink, Filter, Plus, Search, SlidersHorizontal, Users } from "lucide-react";
import { MobileNavigation } from "@/components/MobileNavigation";
import { VendorFormData } from "@/types/vendor";
import { vendors as vendorAPI } from "@/lib/api";
import Header from "@/components/Header";
import { AddVendorModal } from "../../components/vendors/AddVendorModal";
import { useAuthGuard } from "@/lib/auth/useAuthGuard";
import { useRouter } from "next/navigation";

// Simple vendor interface for this page
interface SimpleVendor {
  id: string;
  name: string;
  status: string;
}

const VendorsPage = () => {
  const [vendors, setVendors] = useState<SimpleVendor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const router = useRouter();

  // Protect this page - redirect to login if not authenticated
  const { isLoading: authLoading } = useAuthGuard();

  // Fetch vendors from API
  const fetchVendors = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Frontend: Fetching vendors...');
      const response = await vendorAPI.getAll();
      console.log('Frontend: API response:', response);
      setVendors(response.vendors || []);
      console.log('Frontend: Set vendors:', response.vendors || []);
      setIsLoading(false);
    } catch (err: any) {
      console.error("Error fetching vendors:", err);
      console.error("Error details:", err);
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

  // Handle viewing a vendor
  const handleViewVendor = (vendorId: string) => {
    router.push(`/vendors/${vendorId}`);
  };

  // Handle editing a vendor (placeholder for now - you can implement edit modal later)
  const handleEditVendor = (vendorId: string) => {
    // For now, navigate to the vendor detail page
    // Later you can implement an edit modal or dedicated edit page
    router.push(`/vendors/${vendorId}?edit=true`);
  };

  // Initial fetch on component mount
  useEffect(() => {
    fetchVendors();
  }, []); // Empty dependency array to run only once

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

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
        
        {/* Simple Vendor List */}
        <div className="mt-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-gray-600">Loading vendors...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <button 
                onClick={fetchVendors}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : vendors.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors yet</h3>
              <p className="text-gray-600 mb-6">Get started by adding your first vendor</p>
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary/90 transition-colors"
              >
                Add Your First Vendor
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Your Vendors</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {vendors.map((vendor) => (
                  <div key={vendor.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <Building2 className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <h3 
                          className="text-sm font-medium text-gray-900 hover:text-primary cursor-pointer transition-colors"
                          onClick={() => handleViewVendor(vendor.id)}
                        >
                          {vendor.name}
                        </h3>
                        <p className="text-sm text-gray-500">Status: {vendor.status}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button 
                        onClick={() => handleViewVendor(vendor.id)}
                        className="text-primary hover:text-primary/80 text-sm font-medium transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => handleEditVendor(vendor.id)}
                        className="text-gray-600 hover:text-gray-800 text-sm font-medium transition-colors"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

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