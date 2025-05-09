
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

const ComplianceBarChart = () => {
  // Convert data to percentages for proper display
  const data = [
    { name: 'SOC 2', implemented: 0.83, pending: 0.11, failed: 0.06 },
    { name: 'HIPAA', implemented: 0.75, pending: 0.16, failed: 0.09 },
    { name: 'ISO 27001', implemented: 0.68, pending: 0.22, failed: 0.10 },
    { name: 'GDPR', implemented: 0.90, pending: 0.06, failed: 0.04 },
  ];
  
  const config = {
    implemented: {
      label: "Implemented",
      theme: { light: "#10b981", dark: "#059669" } // green-500 / green-600
    },
    pending: {
      label: "Pending",
      theme: { light: "#f59e0b", dark: "#d97706" } // amber-500 / amber-600
    },
    failed: {
      label: "Failed",
      theme: { light: "#ef4444", dark: "#dc2626" } // red-500 / red-600
    }
  };

  return (
    <div className="h-[300px] w-full">
      <ChartContainer config={config}>
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
          stackOffset="expand"
          barSize={40}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
            axisLine={false}
            tickLine={false}
          />
          <ChartTooltip 
            content={<ChartTooltipContent formatter={(value) => [`${(Number(value) * 100).toFixed(0)}%`]} />}
          />
          <Bar dataKey="implemented" stackId="a" fill="var(--color-implemented)" radius={[4, 4, 0, 0]} />
          <Bar dataKey="pending" stackId="a" fill="var(--color-pending)" />
          <Bar dataKey="failed" stackId="a" fill="var(--color-failed)" />
        </BarChart>
      </ChartContainer>
    </div>
  );
};

export default ComplianceBarChart;
