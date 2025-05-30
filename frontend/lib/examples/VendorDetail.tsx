import React, { useEffect, useState } from 'react';
import { VendorService } from '../services/vendorService';
import { Vendor, QuestionnaireAnswer } from '../types/vendor.types';

interface VendorDetailProps {
  vendorId: string;
}

/**
 * Component to display vendor details including questionnaire answers
 */
export function VendorDetail({ vendorId }: VendorDetailProps) {
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    // Fetch vendor data
    const fetchVendor = async () => {
      try {
        const vendorData = await VendorService.getVendorById(vendorId);
        
        if (!vendorData) {
          setError(`Vendor with ID ${vendorId} not found`);
        } else {
          setVendor(vendorData);
        }
      } catch (err: any) {
        setError(err.message || 'An error occurred while fetching vendor data');
        console.error('Error fetching vendor:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchVendor();
  }, [vendorId]);
  
  if (loading) {
    return <div className="p-4">Loading vendor details...</div>;
  }
  
  if (error || !vendor) {
    return <div className="p-4 text-red-600">{error || 'Vendor not found'}</div>;
  }
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{vendor.name}</h1>
        <div className="mt-2 flex gap-4 text-sm">
          <div className="px-2 py-1 rounded-full bg-gray-100">
            ID: {vendor.id}
          </div>
          <div className={`px-2 py-1 rounded-full ${getStatusColor(vendor.status)}`}>
            {vendor.status}
          </div>
          <div className={`px-2 py-1 rounded-full ${getRiskLevelColor(vendor.riskLevel)}`}>
            Risk: {vendor.riskLevel}
          </div>
        </div>
      </div>
      
      {/* Questionnaire Answers */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Questionnaire Answers</h2>
        
        {vendor.questionnaireAnswers.length === 0 ? (
          <div className="p-4 bg-gray-50 rounded-md">
            No questionnaire answers available.
          </div>
        ) : (
          <div className="space-y-4">
            {vendor.questionnaireAnswers.map((item: QuestionnaireAnswer, index: number) => (
              <div key={item.questionId} className="border rounded-md p-4">
                <h3 className="font-medium text-lg">
                  {index + 1}. {item.question}
                </h3>
                <p className="mt-2">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Vendor Details */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Vendor Details</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-md p-4">
            <h3 className="font-medium">Risk Score</h3>
            <div className="mt-1 flex items-center">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${getRiskScoreColor(vendor.riskScore)}`}
                  style={{ width: `${vendor.riskScore}%` }}
                ></div>
              </div>
              <span className="ml-2">{vendor.riskScore}/100</span>
            </div>
          </div>
          
          <div className="border rounded-md p-4">
            <h3 className="font-medium">Created</h3>
            <p className="mt-1">{formatDate(vendor.createdAt)}</p>
          </div>
          
          {vendor.updatedAt && (
            <div className="border rounded-md p-4">
              <h3 className="font-medium">Last Updated</h3>
              <p className="mt-1">{formatDate(vendor.updatedAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getStatusColor(status: string): string {
  switch (status) {
    case 'Approved':
      return 'bg-green-100 text-green-800';
    case 'In Review':
      return 'bg-blue-100 text-blue-800';
    case 'Pending Review':
      return 'bg-yellow-100 text-yellow-800';
    case 'Questionnaire Pending':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRiskLevelColor(riskLevel: string): string {
  switch (riskLevel) {
    case 'High':
      return 'bg-red-100 text-red-800';
    case 'Medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'Low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getRiskScoreColor(score: number): string {
  if (score > 60) {
    return 'bg-red-600';
  } else if (score > 30) {
    return 'bg-yellow-500';
  } else {
    return 'bg-green-500';
  }
}

function formatDate(date?: Date): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
} 