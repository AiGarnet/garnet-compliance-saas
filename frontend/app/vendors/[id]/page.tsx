import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Generate static params for known vendors at build time
export function generateStaticParams() {
  // For static export on Netlify, we provide a minimal set to ensure build succeeds
  // All other vendor IDs will be handled dynamically with fallback data
  const staticIds = [
    '1', '2', '3' // Just a few basic IDs for build
  ];

  console.log(`Generating static params for ${staticIds.length} vendor IDs`);
  return staticIds.map(id => ({ id: String(id) }));
}

// Enable dynamic params for ALL vendor IDs not in static params
export const dynamicParams = true;

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 