import { QuestionnairesAnswersClient } from './client';

// Use dynamic rendering instead of static generation
export const dynamic = 'force-dynamic';

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Return an empty array since this is a dynamic route that will be 
  // handled client-side and doesn't need pre-rendered paths
  return [];
}

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 