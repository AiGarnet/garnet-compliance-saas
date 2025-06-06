import { QuestionnairesAnswersClient } from './client';
import { redirect } from 'next/navigation';

// Add generateStaticParams for static export
export function generateStaticParams() {
  // Return only the known demo IDs for static generation
  const ids = [
    'demo_1',
    'demo_2', 
    'demo_3'
  ];
  
  return ids.map(id => ({ id: String(id) }));
}

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // List of known static IDs
  const staticIds = ['demo_1', 'demo_2', 'demo_3'];
  
  // If this is a dynamically generated ID (not in static params), redirect to query-based route
  if (!staticIds.includes(params.id)) {
    redirect(`/questionnaires/answers?id=${params.id}`);
  }
  
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 