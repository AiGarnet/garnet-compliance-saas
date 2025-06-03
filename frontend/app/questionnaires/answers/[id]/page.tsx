import { QuestionnairesAnswersClient } from './client';

// For static export compatibility
// export const dynamic = 'force-dynamic';

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Generate a few static paths for the export
  return [
    { id: 'q_123' },
    { id: 'q_456' },
    { id: 'sample_1' }
  ];
}

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 