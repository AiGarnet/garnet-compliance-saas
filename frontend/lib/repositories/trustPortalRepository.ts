import { TrustPortalItem } from '@/types/trustPortal';

export class TrustPortalRepository {
  private baseUrl = process.env.NEXT_PUBLIC_API_URL || '';

  async getVendorsWithTrustPortalItems(): Promise<{ vendorId: number; companyName: string }[]> {
    const response = await fetch(`${this.baseUrl}/api/trust-portal/vendors`);
    if (!response.ok) {
      throw new Error('Failed to fetch vendors');
    }
    return response.json();
  }

  async getVendorTrustPortalItems(vendorId: number): Promise<TrustPortalItem[]> {
    const response = await fetch(`${this.baseUrl}/api/trust-portal/items?vendorId=${vendorId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch trust portal items');
    }
    return response.json();
  }

  async addTrustPortalItem(item: Omit<TrustPortalItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<TrustPortalItem> {
    const response = await fetch(`${this.baseUrl}/api/trust-portal/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(item),
    });

    if (!response.ok) {
      throw new Error('Failed to add trust portal item');
    }

    return response.json();
  }
} 