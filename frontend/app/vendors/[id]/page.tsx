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
    '3',
    '4',
    '5',
    '6',
    // Add support for UUID format vendors
    'ce268669-b2e5-424e-8f1e-ea898dc057ab'
  ];

  console.log(`Generating static params for ${staticIds.length} vendor IDs`);
  return staticIds.map(id => ({ id: String(id) }));
}

// Enable dynamic params for vendor IDs not in static params
export const dynamicParams = true;

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 