import { useState, useEffect } from 'react';
import { vendors } from '@/lib/vendors';

export interface Vendor {
  id: string;
  name: string;
  status: 'Questionnaire Pending' | 'In Review' | 'Approved' | 'Pending Review';
  questionnaireAnswers: { question: string; answer: string }[];
  riskScore?: number;
  riskLevel?: 'Low' | 'Medium' | 'High';
}

// Additional vendor details that might be fetched when viewing a single vendor
export interface VendorDetail extends Vendor {
  createdAt: string;
  updatedAt: string;
  contactName?: string;
  contactEmail?: string;
  website?: string;
  industry?: string;
  description?: string;
  activities: {
    id: string;
    type: 'update' | 'comment' | 'status_change' | 'document';
    message: string;
    timestamp: string;
    user: {
      name: string;
      avatar?: string;
    };
  }[];
}

interface UseVendorResult {
  vendor: VendorDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchVendor: () => void;
}

/**
 * Custom hook for fetching and managing vendor data
 * @param id - The ID of the vendor to fetch
 * @param mockMode - Whether to use mock data instead of real API calls
 */
export function useVendor(id: string, mockMode = true): UseVendorResult {
  const [vendor, setVendor] = useState<VendorDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch vendor data
  const fetchVendor = async () => {
    setIsLoading(true);
    setError(null);

    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      if (mockMode) {
        // Use mock data in development/testing
        const foundVendor = vendors.find(v => v.id === id);
        
        if (!foundVendor) {
          throw new Error('Vendor not found');
        }

        // Enhance the vendor data with additional mock details
        const vendorDetail: VendorDetail = {
          ...foundVendor,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
          contactName: 'John Smith',
          contactEmail: 'john@example.com',
          website: 'https://example.com',
          industry: 'Technology',
          description: 'A leading provider of enterprise software solutions.',
          activities: [
            {
              id: '1',
              type: 'status_change',
              message: `Status changed to ${foundVendor.status}`,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Sarah Johnson',
                avatar: '/images/avatars/sarah.jpg'
              }
            },
            {
              id: '2',
              type: 'comment',
              message: 'Requested additional information regarding data security policies.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Michael Rodriguez',
                avatar: '/images/avatars/michael.jpg'
              }
            },
            {
              id: '3',
              type: 'document',
              message: 'Uploaded SOC 2 Type II Report',
              timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'John Smith',
                avatar: '/images/avatars/john.jpg'
              }
            }
          ]
        };

        setVendor(vendorDetail);
      } else {
        // In a real app, this would be an API call
        const response = await fetch(`/api/vendors/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch vendor data');
        }
        
        const data = await response.json();
        setVendor(data);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching vendor:', err);
      setError(err instanceof Error ? err.message : 'Unable to load vendor details');
      setIsLoading(false);
    }
  };

  // Fetch vendor data on mount and when ID changes
  useEffect(() => {
    if (id) {
      fetchVendor();
    }
  }, [id]);

  return { vendor, isLoading, error, fetchVendor };
} 