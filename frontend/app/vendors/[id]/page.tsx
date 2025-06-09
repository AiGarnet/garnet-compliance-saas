'use client';

import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Dynamic vendor detail page - no static generation
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 