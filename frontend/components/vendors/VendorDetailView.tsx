"use client";

import { useVendor } from '@/hooks/useVendor';
import { VendorDetailHeader } from '@/components/vendors/VendorDetailHeader';
import { VendorInfoCard } from '@/components/vendors/VendorInfoCard';
import { QuestionnaireStatus } from '@/components/vendors/QuestionnaireStatus';
import { VendorActivityFeed } from '@/components/vendors/VendorActivityFeed';
import { VendorDetailSkeleton } from '@/components/vendors/VendorDetailSkeleton';
import { Alert, AlertDescription } from '@/components/ui/Alert';
import { AlertCircle } from 'lucide-react';
import Header from '@/components/Header';

interface VendorDetailViewProps {
  vendorId: string;
}

export function VendorDetailView({ vendorId }: VendorDetailViewProps) {
  const { vendor, isLoading, error, fetchVendor } = useVendor(vendorId);

  // Show skeleton while loading
  if (isLoading) {
    return <VendorDetailSkeleton />;
  }

  // Show error state
  if (error || !vendor) {
    return (
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Unable to load vendor details'}
          </AlertDescription>
        </Alert>
        <div className="flex justify-center">
          <button
            onClick={fetchVendor}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gray-50 dark:bg-body-bg">
        <VendorDetailHeader vendor={vendor} />
        
        <div className="container mx-auto max-w-7xl py-8 px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="lg:col-span-2 space-y-6">
              <QuestionnaireStatus vendor={vendor} />
              <VendorActivityFeed vendor={vendor} />
            </div>
            
            {/* Right column */}
            <div>
              <VendorInfoCard vendor={vendor} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 