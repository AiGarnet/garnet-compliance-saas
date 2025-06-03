import { QuestionnairesAnswersClient } from './client';

// Add generateStaticParams for static export
export function generateStaticParams() {
  // Return all possible IDs that this page needs to handle
  const ids = [
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
  
  return ids.map(id => ({ id }));
}

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 