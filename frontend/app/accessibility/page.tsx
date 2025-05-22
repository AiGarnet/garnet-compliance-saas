import React from 'react';
import { ContrastChecker } from '@/components/design-examples/ContrastChecker';

export const metadata = {
  title: 'Accessibility | GarnetAI Vendor Management',
  description: 'Verify contrast ratios and focus styles for accessibility compliance',
};

export default function AccessibilityPage() {
  return (
    <main>
      <ContrastChecker />
    </main>
  );
} 