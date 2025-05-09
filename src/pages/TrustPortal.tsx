
import React from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Download, Lock, FileCheck, ShieldCheck } from 'lucide-react';

const TrustPortal = () => {
  const securityPolicies = [
    { title: "Information Security Policy", updated: "Apr 15, 2025" },
    { title: "Password Policy", updated: "Mar 22, 2025" },
    { title: "Access Control Policy", updated: "Apr 10, 2025" },
    { title: "Data Classification Policy", updated: "Feb 28, 2025" },
    { title: "Acceptable Use Policy", updated: "Mar 15, 2025" },
  ];

  const certifications = [
    { name: "SOC 2 Type II", date: "Jan 2025 - Dec 2025", logo: "soc2" },
    { name: "ISO 27001", date: "Mar 2024 - Mar 2026", logo: "iso27001" },
    { name: "HIPAA Compliance", date: "Feb 2025 - Feb 2026", logo: "hipaa" },
  ];

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Trust Portal</h1>
        <Button variant="outline">Customize Portal</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-garnet/10 mb-4">
              <ShieldCheck className="h-6 w-6 text-garnet" />
            </div>
            <CardTitle>Security Overview</CardTitle>
            <CardDescription>Share your security posture with clients</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Your trust portal provides transparency about your security and compliance 
              practices with current and potential clients.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              View Public Portal
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-garnet/10 mb-4">
              <Lock className="h-6 w-6 text-garnet" />
            </div>
            <CardTitle>Security Controls</CardTitle>
            <CardDescription>215 controls implemented</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Your security controls are monitored and updated to maintain compliance
              with multiple frameworks.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage Controls
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-garnet/10 mb-4">
              <FileCheck className="h-6 w-6 text-garnet" />
            </div>
            <CardTitle>NDA Management</CardTitle>
            <CardDescription>Control document access</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 mb-4">
              Manage NDAs and client access to your sensitive security documentation
              and certifications.
            </p>
            <Button variant="outline" size="sm" className="w-full">
              Manage NDAs
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Security Policies</CardTitle>
            <CardDescription>
              Your documented security policies and procedures
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {securityPolicies.map((policy, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{policy.title}</p>
                    <p className="text-sm text-gray-500">Last updated: {policy.updated}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
            <CardDescription>
              Your active security certifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {certifications.map((cert, index) => (
                <div key={index} className="flex items-start space-x-4 py-2 border-b last:border-0">
                  <div className="flex-shrink-0 w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                    <span className="text-xs font-medium">{cert.logo}</span>
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{cert.name}</p>
                    <p className="text-sm text-gray-500">Valid: {cert.date}</p>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default TrustPortal;
