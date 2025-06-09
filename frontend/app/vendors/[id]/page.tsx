import { VendorDetailView } from '@/components/vendors/VendorDetailView';

// Generate static params for known vendors at build time
export async function generateStaticParams() {
  try {
    // During build time, try to fetch vendors from the API
    const API_URL = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
    
    const response = await fetch(`${API_URL}/api/vendors`, {
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const vendors = data.vendors || [];
    
    console.log(`Generated static params for ${vendors.length} vendors`);
    
    return vendors.map((vendor: any) => ({
      id: String(vendor.id),
    }));
  } catch (error: any) {
    console.warn('Could not fetch vendors during build, using fallback empty list:', error?.message || error);
    // Return empty array if fetch fails during build
    // The pages will still work at runtime with client-side rendering
    return [];
  }
}

// Client component for vendor detail
export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailView vendorId={params.id} />;
} 