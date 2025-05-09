"use client";

import React from "react";

const DashboardPage = () => {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Good afternoon, Alex Thompson</h1>
        <p className="text-gray-400 mt-1">
          Here’s what’s happening with your compliance at Acme Corp
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <p className="text-sm text-gray-400 mb-1">Compliance Progress</p>
          <h2 className="text-2xl font-bold text-white mb-1">72%</h2>
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: "72%" }} />
          </div>
          <p className="text-xs text-gray-500 mt-2">Target: 100%</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <p className="text-sm text-gray-400 mb-1">Questionnaires</p>
          <h2 className="text-2xl font-bold text-white mb-1">4</h2>
          <p className="text-green-400 text-sm">2 completed this month</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <p className="text-sm text-gray-400 mb-1">High-Risk Vendors</p>
          <h2 className="text-2xl font-bold text-white mb-1">2</h2>
          <p className="text-yellow-400 text-sm">Review required</p>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <p className="text-sm text-gray-400 mb-1">Trust Portal Views</p>
          <h2 className="text-2xl font-bold text-white mb-1">18</h2>
          <p className="text-green-400 text-sm">+24% from last week</p>
        </div>
      </div>

      {/* Main Body Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Tasks */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Pending Tasks</h2>
            <span className="text-sm text-gray-400">4 tasks</span>
          </div>
          <ul className="space-y-4">
            {[
              { title: "Complete SOC 2 Type II readiness assessment", date: "May 15, 2025", priority: "High", assigned: "You" },
              { title: "Review and approve vendor security questionnaire", date: "May 18, 2025", priority: "Medium", assigned: "You" },
              { title: "Update data processing agreement for EU vendors", date: "May 20, 2025", priority: "Medium", assigned: "Sarah Johnson" },
              { title: "Conduct quarterly security awareness training", date: "May 30, 2025", priority: "Low", assigned: "You" }
            ].map((task, idx) => (
              <li key={idx} className="bg-gray-700 hover:bg-gray-600 transition-all text-white p-4 rounded-lg shadow">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">{task.title}</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    task.priority === "High" ? "bg-red-600" :
                    task.priority === "Medium" ? "bg-yellow-500" :
                    "bg-green-600"
                  }`}>
                    {task.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-300">
                  Due {task.date} • Assigned to: {task.assigned}
                </p>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-md ring-1 ring-white/10">
          <div className="flex justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
          </div>
          <ul className="space-y-4 text-sm text-gray-300">
            <li><span className="text-purple-400 font-medium">A</span> Uploaded GDPR certification <br /><span className="text-xs text-gray-500">May 7, 2025 by Alex Thompson</span></li>
            <li><span className="text-green-400 font-medium">M</span> Completed ISO 27001 questionnaire <br /><span className="text-xs text-gray-500">May 5, 2025 by Maria Rodriguez</span></li>
            <li><span className="text-blue-400 font-medium">D</span> Updated vendor risk assessment policy <br /><span className="text-xs text-gray-500">May 3, 2025 by David Wong</span></li>
            <li><span className="text-pink-400 font-medium">S</span> Renewed SSL certificates <br /><span className="text-xs text-gray-500">May 1, 2025 by Sarah Johnson</span></li>
            <li><span className="text-purple-400 font-medium">A</span> Generated SOC 2 compliance report <br /><span className="text-xs text-gray-500">Apr 28, 2025 by Alex Thompson</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
