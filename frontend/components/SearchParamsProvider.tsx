'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

interface SearchParamsProviderProps {
  setVendorId: (id: string | null) => void;
}

export default function SearchParamsProvider({ setVendorId }: SearchParamsProviderProps) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    // Safely get vendorId from searchParams
    const vendorId = searchParams ? searchParams.get('vendorId') : null;
    setVendorId(vendorId);
  }, [searchParams, setVendorId]);
  
  // This component doesn't render anything
  return null;
} 