import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Generate static params for known vendors at build time
export function generateStaticParams() {
  // For static export on Netlify, we provide a comprehensive set of known vendor IDs
  // This ensures the build succeeds without any external dependencies
  const staticIds = [
    // Demo vendors
    'demo_1',
    'demo_2', 
    'demo_3',
    // Numeric IDs
    '1', '2', '3', '4', '5', '6', '7', '8', '9', '10',
    // UUID format vendors (common patterns)
    'ce268669-b2e5-424e-8f1e-ea898dc057ab',
    // Add more common UUID patterns if needed
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000003'
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