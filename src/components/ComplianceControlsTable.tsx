
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface ControlStatus {
  id: string;
  control: string;
  framework: string;
  category: string;
  status: 'implemented' | 'pending' | 'failed';
  lastUpdated: string;
  riskLevel: 'high' | 'medium' | 'low';
}

const ComplianceControlsTable = () => {
  const controls: ControlStatus[] = [
    {
      id: "A.9.2.3",
      control: "Management of privileged access rights",
      framework: "ISO 27001",
      category: "Access Control",
      status: "implemented",
      lastUpdated: "May 1, 2025",
      riskLevel: "high"
    },
    {
      id: "CC5.1",
      control: "Logical access security software",
      framework: "SOC 2",
      category: "Access Controls",
      status: "implemented",
      lastUpdated: "Apr 28, 2025",
      riskLevel: "high"
    },
    {
      id: "164.312",
      control: "Technical safeguards",
      framework: "HIPAA",
      category: "Security",
      status: "pending",
      lastUpdated: "Apr 25, 2025",
      riskLevel: "medium"
    },
    {
      id: "A.12.6.1",
      control: "Management of technical vulnerabilities",
      framework: "ISO 27001",
      category: "Operations Security",
      status: "failed",
      lastUpdated: "Apr 22, 2025",
      riskLevel: "high"
    },
    {
      id: "CC7.1",
      control: "System development lifecycle",
      framework: "SOC 2",
      category: "System Operations",
      status: "implemented",
      lastUpdated: "Apr 20, 2025",
      riskLevel: "low"
    },
    {
      id: "CC6.1",
      control: "Security availability incident handling",
      framework: "SOC 2",
      category: "System Operations",
      status: "pending",
      lastUpdated: "Apr 18, 2025",
      riskLevel: "medium"
    },
    {
      id: "A.18.1.3",
      control: "Protection of records",
      framework: "ISO 27001",
      category: "Compliance",
      status: "implemented",
      lastUpdated: "Apr 15, 2025",
      riskLevel: "low"
    },
    {
      id: "164.308",
      control: "Administrative safeguards",
      framework: "HIPAA",
      category: "Administration",
      status: "implemented",
      lastUpdated: "Apr 10, 2025",
      riskLevel: "medium"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'implemented':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'pending':
        return <AlertTriangle size={16} className="text-amber-500" />;
      case 'failed':
        return <XCircle size={16} className="text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'implemented':
        return "Implemented";
      case 'pending':
        return "Pending";
      case 'failed':
        return "Failed";
      default:
        return status;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'implemented':
        return "text-green-600 bg-green-50";
      case 'pending':
        return "text-amber-600 bg-amber-50";
      case 'failed':
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getRiskBadgeClass = (risk: string) => {
    switch (risk) {
      case 'high':
        return "bg-red-50 text-red-700";
      case 'medium':
        return "bg-amber-50 text-amber-700";
      case 'low':
        return "bg-green-50 text-green-700";
      default:
        return "bg-gray-50 text-gray-700";
    }
  };

  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="w-[300px]">Control</TableHead>
            <TableHead>Framework</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Risk</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {controls.map((control) => (
            <TableRow key={control.id} className="hover:bg-gray-50/80">
              <TableCell className="font-medium">{control.id}</TableCell>
              <TableCell>{control.control}</TableCell>
              <TableCell>
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-gray-100">
                  {control.framework}
                </span>
              </TableCell>
              <TableCell>{control.category}</TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded-md text-xs font-medium ${getRiskBadgeClass(control.riskLevel)}`}>
                  {control.riskLevel.charAt(0).toUpperCase() + control.riskLevel.slice(1)}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(control.status)}
                  <span className={`px-2 py-1 rounded-md text-xs font-medium ${getStatusClass(control.status)}`}>
                    {getStatusText(control.status)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="text-sm text-gray-500">{control.lastUpdated}</TableCell>
              <TableCell>
                <Button variant="ghost" size="sm">View</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <div className="p-4 border-t flex justify-between items-center">
        <div className="text-sm text-gray-500">
          Showing 8 of 215 controls
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" disabled>
            Previous
          </Button>
          <Button variant="outline" size="sm">
            Next
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ComplianceControlsTable;
