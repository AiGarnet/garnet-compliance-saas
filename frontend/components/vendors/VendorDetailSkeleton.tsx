"use client";

import React from 'react';

export function VendorDetailSkeleton() {
  return (
    <div className="animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-gray-200 shadow-sm py-6 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start md:items-center">
              <div className="mr-4 p-2 rounded-full bg-gray-100 h-9 w-9"></div>
              
              <div>
                <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                <div className="flex items-center gap-4">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                  <div className="h-6 bg-gray-200 rounded w-28"></div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="h-10 bg-gray-200 rounded w-24"></div>
              <div className="h-10 bg-gray-200 rounded w-36"></div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breadcrumbs Skeleton */}
      <div className="container mx-auto max-w-7xl px-4 md:px-6 py-4">
        <div className="h-6 bg-gray-200 rounded w-72"></div>
      </div>
      
      {/* Content Skeleton */}
      <div className="container mx-auto max-w-7xl px-4 md:px-6 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-40 mb-6"></div>
              
              <div className="space-y-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex">
                    <div className="h-5 w-5 rounded-full bg-gray-200 mr-3"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-40"></div>
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="flex justify-between mb-2">
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Column 2 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-48 mb-6"></div>
              
              <div className="h-20 bg-gray-200 rounded w-full mb-6"></div>
              
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-6"></div>
                
                <div className="h-6 bg-gray-200 rounded w-36 mb-4"></div>
                
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-gray-100 pb-4 mb-4">
                    <div className="h-5 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Column 3 */}
          <div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="h-6 bg-gray-200 rounded w-32 mb-6"></div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex mb-6 pb-4 border-b border-gray-100">
                  <div className="h-8 w-8 rounded-full bg-gray-200 mr-3"></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <div className="h-5 bg-gray-200 rounded w-28"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 