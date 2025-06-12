import { useState, useEffect } from 'react';

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
export function useVendor(id: string, mockMode = false): UseVendorResult {
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
        // Create a mock vendor for development/testing
        const mockVendor = {
          id: id,
          name: `Mock Vendor ${id.includes('-') ? id.split('-')[0] : id}`,
          status: 'In Review' as const,
          questionnaireAnswers: [
            { question: "Do you store personal data?", answer: "Yes" },
            { question: "Is data encrypted at rest?", answer: "Yes" },
            { question: "Do you have a data retention policy?", answer: "Yes" },
            { question: "Do you conduct regular security audits?", answer: "Partially" }
          ],
          riskScore: Math.floor(Math.random() * 60) + 20, // Random score between 20-80
          riskLevel: 'Medium' as const
        };
        
        // Enhance the vendor data with additional mock details
        const vendorDetail: VendorDetail = {
          ...mockVendor,
          createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          contactName: 'John Smith',
          contactEmail: 'contact@vendor.com',
          website: 'https://vendor-website.com',
          industry: 'Technology',
          description: 'A leading provider of enterprise software solutions and services.',
          activities: [
            {
              id: '1',
              type: 'status_change',
              message: `Status changed to ${mockVendor.status}`,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Sarah Johnson',
                avatar: '/images/avatars/sarah.jpg'
              }
            },
            {
              id: '2',
              type: 'comment',
              message: 'Initial vendor assessment completed.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Michael Rodriguez',
                avatar: '/images/avatars/michael.jpg'
              }
            }
          ]
        };
        
        console.log(`Created mock vendor for ID: ${id}`);
        setVendor(vendorDetail);
        setIsLoading(false);
        return;
      } else {
        // Use the API client to fetch vendor data
        const { vendors } = await import('@/lib/api');
        const response = await vendors.getById(id);
        
        console.log('useVendor: API response:', response);
        
        if (!response.vendor) {
          throw new Error('Vendor not found');
        }
        
        // Transform the API response to match our VendorDetail interface
        const apiVendor = response.vendor;
        const vendorDetail: VendorDetail = {
          // Map backend fields to frontend interface
          id: apiVendor.uuid || apiVendor.id || id,
          name: apiVendor.companyName || apiVendor.name || 'Unknown Vendor',
          status: apiVendor.status || 'Questionnaire Pending',
          riskScore: apiVendor.riskScore || 50,
          riskLevel: apiVendor.riskLevel || 'Medium',
          createdAt: apiVendor.createdAt || new Date().toISOString(),
          updatedAt: apiVendor.updatedAt || new Date().toISOString(),
          contactName: apiVendor.contactName || null,
          contactEmail: apiVendor.contactEmail || null,
          website: apiVendor.website || null,
          industry: apiVendor.industry || null,
          description: apiVendor.description || null,
          
          // Map questionnaire answers from backend format
          questionnaireAnswers: (apiVendor.questionnaireAnswers || []).map((qa: any) => ({
            question: qa.question,
            answer: qa.answer
          })),
          
          // Generate mock activities for now
          activities: [
            {
              id: '1',
              type: 'status_change',
              message: `Status changed to ${apiVendor.status}`,
              timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'System',
                avatar: '/images/avatars/system.jpg'
              }
            },
            {
              id: '2',
              type: 'comment',
              message: 'Vendor assessment completed successfully.',
              timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
              user: {
                name: 'Compliance Team',
                avatar: '/images/avatars/compliance.jpg'
              }
            }
          ]
        };
        
        console.log('useVendor: Setting vendor detail:', vendorDetail);
        setVendor(vendorDetail);
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