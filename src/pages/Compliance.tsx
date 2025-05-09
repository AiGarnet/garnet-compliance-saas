
import React, { useState } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle, Search, Filter, Download, ChartBar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { ChartContainer } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ComplianceStatusCards from '@/components/ComplianceStatusCards';
import ComplianceBarChart from '@/components/ComplianceBarChart';
import ComplianceControlsTable from '@/components/ComplianceControlsTable';

const Compliance = () => {
  const [activeTab, setActiveTab] = useState("overview");
  
  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Compliance Management</h1>
          <p className="text-gray-500">Monitor and manage compliance across multiple frameworks</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter size={16} />
            Filter
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={16} />
            Export
          </Button>
          <Button className="bg-garnet hover:bg-garnet-dark">Generate Report</Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="mb-8">
        <TabsList className="grid w-full md:w-auto grid-cols-3 h-auto p-1">
          <TabsTrigger 
            value="overview" 
            className="data-[state=active]:bg-garnet/10 data-[state=active]:text-garnet"
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="controls" 
            className="data-[state=active]:bg-garnet/10 data-[state=active]:text-garnet"
            onClick={() => setActiveTab("controls")}
          >
            Controls
          </TabsTrigger>
          <TabsTrigger 
            value="evidence" 
            className="data-[state=active]:bg-garnet/10 data-[state=active]:text-garnet"
            onClick={() => setActiveTab("evidence")}
          >
            Evidence
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6">
          <ComplianceStatusCards />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Compliance Progress</CardTitle>
                <CardDescription>
                  Implementation progress across frameworks
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ComplianceBarChart />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Risk Distribution</CardTitle>
                <CardDescription>
                  Breakdown of control risk levels
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="grid grid-cols-3 gap-4 h-full items-center">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-red-100 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-red-600">14</span>
                    </div>
                    <span className="text-sm text-gray-600">High Risk</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-amber-100 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-amber-600">28</span>
                    </div>
                    <span className="text-sm text-gray-600">Medium Risk</span>
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mb-2">
                      <span className="text-2xl font-bold text-green-600">189</span>
                    </div>
                    <span className="text-sm text-gray-600">Low Risk</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest compliance-related activities and updates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((item) => (
                  <div key={item} className="flex items-start gap-4 p-2 rounded-md hover:bg-gray-50">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${item % 3 === 0 ? 'bg-green-100' : item % 3 === 1 ? 'bg-amber-100' : 'bg-red-100'}`}>
                      {item % 3 === 0 ? <CheckCircle size={16} className="text-green-600" /> : 
                       item % 3 === 1 ? <AlertTriangle size={16} className="text-amber-600" /> :
                       <XCircle size={16} className="text-red-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item % 3 === 0 ? 'Control Implemented' : item % 3 === 1 ? 'Evidence Requested' : 'Control Failed'}</span>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded">SOC 2</span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {item % 3 === 0 ? 'Access review control CC5.2 was marked as implemented' : 
                         item % 3 === 1 ? 'New evidence requested for vulnerability management control' :
                         'Encryption at rest control failed compliance check'}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {`May ${item}, 2025 • ${(item * 2) + 8}:${item * 10}${item % 2 === 0 ? 'AM' : 'PM'}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="controls" className="mt-6">
          <div className="mb-6 flex flex-col md:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input placeholder="Search controls..." className="pl-9" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                Framework: All
              </Button>
              <Button variant="outline" size="sm">
                Status: All
              </Button>
              <Button variant="outline" size="sm">
                Category: All
              </Button>
            </div>
          </div>
          <ComplianceControlsTable />
        </TabsContent>
        
        <TabsContent value="evidence" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Evidence Repository</CardTitle>
              <CardDescription>
                Manage and review collected evidence for audits
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <ChartBar size={48} className="text-gray-300 mb-4" />
                <h3 className="text-lg font-medium">Evidence Repository</h3>
                <p className="text-sm text-gray-500 max-w-md mt-2">
                  This area will display uploaded evidence items, policies, and documentation for compliance audits.
                </p>
                <Button className="mt-4 bg-garnet hover:bg-garnet-dark">
                  Upload Evidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Compliance;
