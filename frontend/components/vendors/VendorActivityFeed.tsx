"use client";

import React from 'react';
import { VendorDetail } from '@/hooks/useVendor';
import { MessageSquare, FileText, AlertCircle, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface VendorActivityFeedProps {
  vendor: VendorDetail;
}

export function VendorActivityFeed({ vendor }: VendorActivityFeedProps) {
  // Sort activities by timestamp, most recent first
  const sortedActivities = [...vendor.activities].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'comment':
        return <MessageSquare className="h-5 w-5 text-secondary" />;
      case 'document':
        return <FileText className="h-5 w-5 text-primary" />;
      case 'status_change':
        return <RefreshCw className="h-5 w-5 text-warning" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };
  
  return (
    <div className="bg-white dark:bg-card-bg rounded-lg shadow-sm border border-gray-200 dark:border-card-border p-6">
      <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Recent Activity</h2>
      
      {sortedActivities.length === 0 ? (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p>No activity recorded yet</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {sortedActivities.map((activity) => (
            <li key={activity.id} className="border-b border-gray-100 dark:border-gray-700 pb-4">
              <div className="flex">
                <div className="mr-3 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    {getActivityIcon(activity.type)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:justify-between">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      <span className="font-semibold">{activity.user.name}</span>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{activity.message}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      <div className="mt-4 text-center">
        <button className="text-sm text-primary hover:underline">
          View all activity
        </button>
      </div>
    </div>
  );
} 