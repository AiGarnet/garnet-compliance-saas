import { redirect } from 'next/navigation';

export async function generateStaticParams() {
  // For static export, we need to provide some common questionnaire IDs
  // that might be pre-rendered. This is for the redirect page.
  const commonIds = [
    'demo_1', 'demo_2', 'demo_3',
    'q_100', 'q_101', 'q_102',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  return commonIds.map(id => ({ id }));
}

export default function QuestionnairePage({ params }: { params: { id: string } }) {
  // Redirect to the answers page for this questionnaire
  redirect(`/questionnaires/answers/${params.id}`);
} 