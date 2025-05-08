"use client";

import React from 'react';

export default function Home() {
  return (
    <div className="py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Welcome to the Next.js App
          </h1>
          <p className="mt-4 text-xl text-gray-500">
            A simple Next.js application with TypeScript in a monorepo structure
          </p>
          <div className="mt-8">
            <a
              href="/dashboard"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 