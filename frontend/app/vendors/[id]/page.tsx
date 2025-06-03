import { VendorDetailClient } from './client';

// For static site generation in Next.js
export const dynamic = 'force-dynamic';

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Return an empty array since this is a dynamic route that will be 
  // handled client-side and doesn't need pre-rendered paths
  return [];
}

export default function VendorDetailPage({ params }: { params: { id: string } }) {
  return <VendorDetailClient id={params.id} />;
} 