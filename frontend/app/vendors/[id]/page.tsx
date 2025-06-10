import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Generate static params for known vendors at build time
export function generateStaticParams() {
  // For static export on Netlify, we provide a minimal set of known vendor IDs
  // This ensures the build succeeds without any external dependencies
  const staticIds = [
    'demo_1',
    'demo_2', 
    'demo_3',
    '1', // Common IDs that might exist
    '2',
    '3'
  ];

  console.log(`Generating static params for ${staticIds.length} vendor IDs`);
  return staticIds.map(id => ({ id: String(id) }));
}

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 