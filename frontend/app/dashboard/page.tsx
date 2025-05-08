"use client";

import React from 'react';
import Link from 'next/link';

export default function Dashboard() {
  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-4 text-gray-600">
            This is a simple dashboard page in the Next.js application.
          </p>
          <div className="mt-6">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Statistics</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Various statistics would be displayed here.</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 overflow-hidden shadow rounded-lg">
                <div className="px-4 py-5 sm:p-6">
                  <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Recent user activity would be displayed here.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <Link href="/" className="text-blue-600 hover:text-blue-800">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 