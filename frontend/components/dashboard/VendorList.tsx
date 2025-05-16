"use client";

import React from 'react';
import { cn } from '@/lib/utils';
import { PlusCircle } from 'lucide-react';

export interface Vendor {
  id: string;
  name: string;
}

export interface VendorListProps {
  vendors: Vendor[];
  className?: string;
}

export function VendorList({ vendors, className }: VendorListProps) {
  return (
    <section 
      aria-label="Vendor list" 
      className={cn(
        "bg-white p-8 rounded-xl shadow-sm border border-gray-200",
        className
      )}
    >
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-xl font-semibold text-gray-800">Vendors</h2>
        <button 
          className={cn(
            "inline-flex items-center text-sm font-medium px-4 py-2 rounded-md border transition-colors",
            vendors.length > 0 
              ? "text-purple-600 border-purple-300 hover:border-purple-500"
              : "text-gray-400 border-gray-200 cursor-not-allowed opacity-60"
          )}
          disabled={vendors.length === 0}
          aria-disabled={vendors.length === 0}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Vendor
        </button>
      </div>

      {vendors.length === 0 ? (
        <div 
          className="border-2 border-dashed border-gray-200 rounded-md p-16 flex flex-col items-center justify-center"
          aria-live="polite"
        >
          <p className="text-gray-500 text-center">No vendors added yet.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {vendors.map(vendor => (
            <li 
              key={vendor.id}
              className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <span className="text-gray-800 font-medium">{vendor.name}</span>
              <button className="text-sm text-purple-600 hover:text-purple-800">
                View Details
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
} 