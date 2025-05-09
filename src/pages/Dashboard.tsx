
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

const Dashboard = () => {
  // Sample data for the dashboard
  const complianceScore = 78;
  const totalControls = 215;
  const implementedControls = 168;
  const pendingControls = 30;
  const failedControls = 17;
  
  const recentActivities = [
    { id: 1, activity: "Updated ISO 27001 questionnaire", date: "May 1, 2025", user: "John Smith" },
    { id: 2, activity: "Completed SOC 2 Type II evidence collection", date: "Apr 29, 2025", user: "Maria Rodriguez" },
    { id: 3, activity: "Updated security policies", date: "Apr 25, 2025", user: "David Wong" },
    { id: 4, activity: "Renewed SSL certificates", date: "Apr 22, 2025", user: "Sarah Johnson" },
  ];
  
  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Compliance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end space-x-2">
              <span className="text-3xl font-bold">{complianceScore}%</span>
              <Progress value={complianceScore} className="h-2 mt-2 mb-1 w-full" />
            </div>
            <p className="text-sm text-gray-500 mt-2">Updated yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Controls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalControls}</div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <CheckCircle size={16} className="text-green-500 mr-2" />
                <span className="text-sm">Implemented: {implementedControls}</span>
              </div>
              <div className="flex items-center">
                <AlertTriangle size={16} className="text-amber-500 mr-2" />
                <span className="text-sm">Pending: {pendingControls}</span>
              </div>
              <div className="flex items-center">
                <XCircle size={16} className="text-red-500 mr-2" />
                <span className="text-sm">Failed: {failedControls}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Framework Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">SOC 2 Type II</span>
                  <span className="text-sm font-medium">83%</span>
                </div>
                <Progress value={83} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">HIPAA</span>
                  <span className="text-sm font-medium">75%</span>
                </div>
                <Progress value={75} className="h-2" />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">ISO 27001</span>
                  <span className="text-sm font-medium">68%</span>
                </div>
                <Progress value={68} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>User</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivities.map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell>{activity.activity}</TableCell>
                  <TableCell>{activity.date}</TableCell>
                  <TableCell>{activity.user}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default Dashboard;
