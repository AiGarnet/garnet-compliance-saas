"use client";

import React from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { Building2, Mail, Globe, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface VendorInfoCardProps {
  vendor: VendorDetail;
}

export function VendorInfoCard({ vendor }: VendorInfoCardProps) {
  return (
    <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Vendor Overview</h2>
      
      <div className="space-y-4">
        <div className="flex items-start">
          <Building2 className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Company</p>
            <p className="font-medium text-gray-800 dark:text-white">{vendor.name}</p>
            {vendor.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{vendor.description}</p>
            )}
          </div>
        </div>
        
        {vendor.contactName && (
          <div className="flex items-start">
            <User className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Contact Person</p>
              <p className="font-medium text-gray-800 dark:text-white">{vendor.contactName}</p>
            </div>
          </div>
        )}
        
        {vendor.contactEmail && (
          <div className="flex items-start">
            <Mail className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
              <a 
                href={`mailto:${vendor.contactEmail}`} 
                className="font-medium text-primary hover:underline"
              >
                {vendor.contactEmail}
              </a>
            </div>
          </div>
        )}
        
        {vendor.website && (
          <div className="flex items-start">
            <Globe className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Website</p>
              <a 
                href={vendor.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="font-medium text-primary hover:underline"
              >
                {vendor.website}
              </a>
            </div>
          </div>
        )}
        
        <div className="flex items-start">
          <Calendar className="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3 mt-0.5" />
          <div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Onboarded</p>
            <p className="font-medium text-gray-800 dark:text-white">
              {vendor.createdAt ? format(new Date(vendor.createdAt), 'MMMM d, yyyy') : 'Unknown'}
            </p>
          </div>
        </div>
        
        {vendor.riskScore !== undefined && (
          <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600 dark:text-gray-300">Risk Score</span>
              <span className={cn(
                "text-sm font-medium",
                vendor.riskScore < 30 ? 'text-success' : 
                vendor.riskScore < 60 ? 'text-warning' : 
                'text-danger'
              )}>
                {vendor.riskScore}/100
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div 
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  vendor.riskScore < 30 ? 'bg-emerald-500 dark:bg-success' : 
                  vendor.riskScore < 60 ? 'bg-amber-500 dark:bg-warning' : 
                  'bg-rose-500 dark:bg-danger'
                )} 
                style={{ width: `${vendor.riskScore}%` }}
              ></div>
            </div>
            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 flex justify-between">
              <span>Low Risk</span>
              <span>High Risk</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 