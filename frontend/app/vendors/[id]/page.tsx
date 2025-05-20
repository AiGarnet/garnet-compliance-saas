import { vendors } from '@/lib/vendors';
import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// This function generates the static paths at build time
export function generateStaticParams() {
  // Return a list of possible values for id
  return vendors.map((vendor) => ({
    id: vendor.id,
  }));
}

// Server Component
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 