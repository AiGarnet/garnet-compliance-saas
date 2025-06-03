import { QuestionnairesAnswersClient } from './client';

// Use dynamic rendering instead of static generation
export const dynamic = 'force-dynamic';

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 