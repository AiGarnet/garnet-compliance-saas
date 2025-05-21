"use client";

import React from 'react';

export function VendorDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-body-bg">
      {/* Header skeleton */}
      <div className="bg-white dark:bg-card-bg border-b border-gray-200 dark:border-card-border shadow-sm py-6 px-4 md:px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start md:items-center">
              <div className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                <div className="h-5 w-5 bg-gray-300 dark:bg-gray-600 rounded-full"></div>
              </div>
              <div>
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content skeleton */}
      <div className="container mx-auto max-w-7xl py-8 px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 - Questionnaire Status */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6"></div>
              
              <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded w-full mb-6"></div>
              
              <div className="space-y-4">
                <div className="flex justify-between mb-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-6">
                  <div className="h-2.5 bg-gray-300 dark:bg-gray-600 rounded-full w-1/2"></div>
                </div>
                
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-36 mb-4"></div>
                
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-gray-100 dark:border-gray-700 pb-4 mb-4">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Column 2 - Activity Feed */}
            <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            </div>
          </div>
          
          {/* Column 3 - Vendor Info */}
          <div>
            <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
              <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
              
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 mr-3"></div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                  </div>
                </div>
              ))}
              
              <div className="flex justify-center">
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 