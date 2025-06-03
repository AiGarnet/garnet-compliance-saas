import { ChatClient } from './ChatClient';

export async function generateStaticParams() {
  // This returns a list of params that will be pre-rendered at build time
  // We need to provide all possible questionnaire IDs for static export
  
  // Include common IDs for pre-existing questionnaires
  const commonIds = [
    'demo_1',
    'demo_2',
    'demo_3',
    'q_100',
    'q_101',
    'q_102',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  // For local development or server-side rendering, we could fetch from an API
  // But for static export, we need to pre-define all possible IDs
  
  // Make sure each id is explicitly cast as a string
  return commonIds.map(id => ({ id: String(id) }));
}

// Server component that passes params to client component
export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatClient params={params} />;
} 