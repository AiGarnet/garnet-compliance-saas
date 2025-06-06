import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // For static export, we provide common questionnaire IDs
  const staticIds = [
    'demo_1', 'demo_2', 'demo_3',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  return staticIds.map(id => ({ id }));
}

// Allow dynamic params that aren't in generateStaticParams
export const dynamicParams = true;

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  // For questionnaire pages, redirect to the chat interface
  // This provides a clean URL structure
  redirect(`/questionnaires/${params.id}/chat`);
} 