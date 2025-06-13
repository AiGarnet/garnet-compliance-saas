import { NextRequest, NextResponse } from 'next/server';
import { TrustPortalRepository } from '@/lib/repositories/trustPortalRepository';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const vendorId = searchParams.get('vendorId');

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: 400 }
      );
    }

    const repository = new TrustPortalRepository();
    const items = await repository.getVendorTrustPortalItems(parseInt(vendorId));
    return NextResponse.json(items);
  } catch (error) {
    console.error('Error fetching trust portal items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trust portal items' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repository = new TrustPortalRepository();
    const item = await repository.addTrustPortalItem(body);
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error adding trust portal item:', error);
    return NextResponse.json(
      { error: 'Failed to add trust portal item' },
      { status: 500 }
    );
  }
} 