import { VendorDetailClient } from './client';

// For static export compatibility
// export const dynamic = 'force-dynamic';

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Generate a few static paths for the export
  return [
    { id: 'vendor_1' },
    { id: 'vendor_2' },
    { id: 'acme_corp' }
  ];
}

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailClient id={params.id} />;
} 