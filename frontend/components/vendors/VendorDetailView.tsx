"use client";

import { useVendor } from '@/hooks/useVendor';
import { VendorDetailHeader } from '@/components/vendors/VendorDetailHeader';
import { VendorInfoCard } from '@/components/vendors/VendorInfoCard';
import { QuestionnaireStatus } from '@/components/vendors/QuestionnaireStatus';
import { VendorQuestionnaireAnswers } from '@/components/vendors/VendorQuestionnaireAnswers';
import { VendorActivityFeed } from '@/components/vendors/VendorActivityFeed';
import { VendorDetailSkeleton } from '@/components/vendors/VendorDetailSkeleton';
import { EditVendorModal } from '@/components/vendors/EditVendorModal';
import { VendorEvidenceSection } from '@/components/vendors/VendorEvidenceSection';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { vendors as vendorAPI } from '@/lib/api';
import { VendorFormData } from '@/types/vendor';

interface VendorDetailViewProps {
  vendorId: string;
}

export function VendorDetailView({ vendorId }: VendorDetailViewProps) {
  const { vendor, isLoading, error, fetchVendor } = useVendor(vendorId);
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Check if edit mode is requested via URL parameter (client-side only)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const editParam = urlParams.get('edit');
      if (editParam === 'true' && vendor) {
        setIsEditModalOpen(true);
        // Remove the edit parameter from URL
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('edit');
        window.history.replaceState({}, '', newUrl.toString());
      }
    }
  }, [vendor]);

  // Handle vendor update
  const handleUpdateVendor = async (vendorData: VendorFormData) => {
    try {
      await vendorAPI.update(vendorId, vendorData);
      setIsEditModalOpen(false);
      // Refresh vendor data
      fetchVendor();
    } catch (err: any) {
      console.error("Error updating vendor:", err);
      throw new Error(err.message || 'Failed to update vendor');
    }
  };

  // Show skeleton while loading
  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  // Show error state
  if (error || !vendor) {
    return (
      <>
        <Header />
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <Alert variant="destructive" className="mb-8">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Unable to load vendor details'}
            </AlertDescription>
          </Alert>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/vendors')}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors flex items-center"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Vendors
            </button>
            <button
              onClick={fetchVendor}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-body-bg">
        <VendorDetailHeader vendor={vendor} onEdit={() => setIsEditModalOpen(true)} />
        
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <QuestionnaireStatus vendor={vendor} />
              <VendorQuestionnaireAnswers vendor={vendor} />
              <VendorEvidenceSection vendor={vendor} />
              <VendorActivityFeed vendor={vendor} />
            </div>
            
            {/* Right column */}
            <div>
              <VendorInfoCard vendor={vendor} />
            </div>
          </div>
        </div>
      </div>

      {/* Edit Vendor Modal */}
      {vendor && (
        <EditVendorModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSubmit={handleUpdateVendor}
          vendor={vendor}
        />
      )}
    </>
  );
} 