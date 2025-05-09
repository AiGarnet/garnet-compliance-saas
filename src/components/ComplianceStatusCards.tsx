
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

interface FrameworkStatus {
  name: string;
  progress: number;
  controls: number;
  implemented: number;
  pending: number;
  failed: number;
}

const ComplianceStatusCards = () => {
  const frameworkStatus: FrameworkStatus[] = [
    { 
      name: "SOC 2 Type II", 
      progress: 83, 
      controls: 124,
      implemented: 103,
      pending: 14,
      failed: 7
    },
    { 
      name: "HIPAA", 
      progress: 75, 
      controls: 75,
      implemented: 56,
      pending: 12,
      failed: 7
    },
    { 
      name: "ISO 27001", 
      progress: 68, 
      controls: 114,
      implemented: 78,
      pending: 25,
      failed: 11
    },
    { 
      name: "GDPR", 
      progress: 90, 
      controls: 48,
      implemented: 43,
      pending: 3,
      failed: 2
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {frameworkStatus.map((framework, index) => (
        <Card key={index} className="border-l-4" style={{ borderLeftColor: getColorByProgress(framework.progress) }}>
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium">{framework.name}</h3>
              <div className="px-2 py-1 rounded bg-gray-100 text-xs font-medium">
                {framework.controls} Controls
              </div>
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-2xl font-bold">{framework.progress}%</span>
              <span className="text-sm text-gray-500">compliant</span>
            </div>
            
            <Progress 
              value={framework.progress} 
              className="h-2 mb-4" 
              style={{ 
                backgroundColor: '#f1f1f1',
                '--tw-progress-color': getColorByProgress(framework.progress)
              } as React.CSSProperties} 
            />
            
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <div className="flex items-center">
                  <CheckCircle size={12} className="text-green-500 mr-1" />
                  <span className="text-gray-600">{framework.implemented}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <AlertTriangle size={12} className="text-amber-500 mr-1" />
                  <span className="text-gray-600">{framework.pending}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center">
                  <XCircle size={12} className="text-red-500 mr-1" />
                  <span className="text-gray-600">{framework.failed}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

function getColorByProgress(progress: number): string {
  if (progress >= 90) return '#10b981'; // green-500
  if (progress >= 70) return '#22c55e'; // green-600
  if (progress >= 50) return '#f59e0b'; // amber-500
  return '#ef4444'; // red-500
}

export default ComplianceStatusCards;
