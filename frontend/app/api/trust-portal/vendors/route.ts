import { NextResponse } from 'next/server';
import { TrustPortalRepository } from '@/lib/repositories/trustPortalRepository';

export async function GET() {
  try {
    const repository = new TrustPortalRepository();
    const vendors = await repository.getVendorsWithTrustPortalItems();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
} 