"use client";

import React from "react";

const DashboardPage = () => {
  return (
    <div className="w-full max-w-7xl mx-auto p-6 md:p-8 pb-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Welcome back, Sarah</h1>
        <p className="text-gray-600">Here's an overview of your compliance status</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Card 1: Compliance Progress */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Compliance Progress</h2>
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-800 mb-2">78%</p>
          <div className="h-1.5 w-full bg-gray-100 rounded-full mb-1">
            <div className="h-1.5 bg-purple-600 rounded-full" style={{ width: '78%' }}></div>
          </div>
          <p className="text-xs text-gray-500">+12% from last month</p>
        </div>
        
        {/* Card 2: Questionnaires */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Questionnaires In Progress</h2>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-800 mb-2">5</p>
          <p className="text-xs text-gray-500">2 due this week</p>
        </div>
        
        {/* Card 3: High-Risk Vendors */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-600">High-Risk Vendors</h2>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-800 mb-2">3</p>
          <p className="text-xs text-red-500">Requires immediate review</p>
        </div>
        
        {/* Card 4: Trust Portal Views */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-sm font-semibold text-gray-600">Trust Portal Views</h2>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          <p className="text-3xl font-semibold text-gray-800 mb-2">127</p>
          <p className="text-xs text-gray-500">+24% from last week</p>
        </div>
      </div>

      {/* Two Column Layout for Tasks and Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Pending Tasks</h2>
            <a href="#" className="text-sm text-red-600 font-medium hover:text-red-700">View All</a>
          </div>
          
          <ul className="space-y-4">
            <li className="border-b border-gray-100 pb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-800">Complete SOC 2 gap assessment</span>
                <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded-full">High</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assigned to you</span>
                <span className="text-gray-600">Due in 2 days</span>
              </div>
            </li>
            
            <li className="border-b border-gray-100 pb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-800">Update vendor risk assessments</span>
                <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">Medium</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assigned to you</span>
                <span className="text-gray-600">Due in 5 days</span>
              </div>
            </li>
            
            <li className="border-b border-gray-100 pb-4">
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-800">Conduct security awareness training</span>
                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-full">Low</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assigned to you</span>
                <span className="text-gray-600">Due in 1 week</span>
              </div>
            </li>
            
            <li>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-800">Review privacy policy updates</span>
                <span className="bg-yellow-100 text-yellow-600 text-xs px-2 py-1 rounded-full">Medium</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Assigned to you</span>
                <span className="text-gray-600">Due in 3 days</span>
              </div>
            </li>
          </ul>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
            <a href="#" className="text-sm text-red-600 font-medium hover:text-red-700">View All</a>
          </div>
          
          <ul className="space-y-4">
            <li className="border-b border-gray-100 pb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">Michael Rodriguez</span> uploaded a new evidence document for ISO 27001
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Today, 10:45 AM</p>
                </div>
              </div>
            </li>
            
            <li className="border-b border-gray-100 pb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">You</span> completed the GDPR compliance assessment
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday, 3:20 PM</p>
                </div>
              </div>
            </li>
            
            <li className="border-b border-gray-100 pb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">Jennifer Wilson</span> created a new vendor questionnaire
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Yesterday, 11:35 AM</p>
                </div>
              </div>
            </li>
            
            <li className="border-b border-gray-100 pb-4">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">System</span> flagged a high-risk vendor: CloudSecure Inc.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Apr 12, 2:15 PM</p>
                </div>
              </div>
            </li>
            
            <li>
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3 flex-shrink-0">
                  <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    <span className="font-semibold">Alex Thompson</span> viewed your trust portal details
                  </p>
                  <p className="text-xs text-gray-500 mt-1">Apr 11, 9:30 AM</p>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
