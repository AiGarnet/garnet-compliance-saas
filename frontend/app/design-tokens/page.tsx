import React from 'react';
import { DesignTokensExample } from '@/components/design-examples/DesignTokens';

export const metadata = {
  title: 'Design Tokens | GarnetAI Vendor Management',
  description: 'CSS custom properties for design consistency across the application',
};

export default function DesignTokensPage() {
  return (
    <main>
      <DesignTokensExample />
    </main>
  );
} 