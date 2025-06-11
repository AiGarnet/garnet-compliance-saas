import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Generate static params for known vendors at build time
export async function generateStaticParams() {
  try {
    // Try to fetch real vendor IDs from the API for static generation
    const response = await fetch('https://garnet-compliance-saas-production.up.railway.app/api/vendors');
    const data = await response.json();
    
    if (data.vendors && data.vendors.length > 0) {
      const vendorIds = data.vendors.map((vendor: any) => ({
        id: vendor.uuid || vendor.id || vendor.vendorId?.toString()
      })).filter((item: any) => item.id); // Filter out any undefined IDs
      
      console.log(`Generating static params for ${vendorIds.length} vendor IDs from API`);
      return vendorIds;
    }
  } catch (error) {
    console.error('Failed to fetch vendors for static generation:', error);
  }
  
  // Fallback to known vendor IDs if API fails
  const staticIds = [
    '9321c032-0146-4751-be7b-1683d8b5a1b9', // Acme Payments
    'ce268669-b2e5-424e-8f1e-ea898dc057ab', // Oscorp Industries  
    'ceb432fd-74c8-4b5f-b09e-da45ac14830c', // Global Data Services
    '1', '2', '3' // Basic fallback IDs
  ];

  console.log(`Generating static params for ${staticIds.length} fallback vendor IDs`);
  return staticIds.map(id => ({ id: String(id) }));
}

// Enable dynamic params for ALL vendor IDs not in static params
export const dynamicParams = true;

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 