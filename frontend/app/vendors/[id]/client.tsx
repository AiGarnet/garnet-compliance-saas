"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { VendorDetailView } from '@/components/vendors/VendorDetailView';

export function VendorDetailClient({ id }: { id: string }) {
  return <VendorDetailView vendorId={id} />;
} 