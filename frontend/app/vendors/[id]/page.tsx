import { vendors } from '@/lib/vendors';
import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// This function generates the static paths at build time
export function generateStaticParams() {
  // Make sure each id is explicitly cast as a string
  return vendors.map((vendor) => ({
    id: String(vendor.id),
  }));
}

// Server Component
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 