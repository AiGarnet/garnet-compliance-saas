import { QuestionnairesAnswersClient } from './client';

// This function is required for static exports with dynamic routes
// It generates all possible values for the [id] parameter
export function generateStaticParams() {
  // For static sites, we need to provide the possible IDs
  // Since this is client-side data from localStorage, we'll provide a few example IDs
  // In production, you would fetch these from your API or database
  return [
    { id: 'example-id-1' },
    { id: 'example-id-2' },
    { id: 'example-id-3' },
    // Add more IDs as needed
  ];
}

export default function QuestionnairesAnswersPage({ params }: { params: { id: string } }) {
  // Server component that passes params to the client component
  return <QuestionnairesAnswersClient id={params.id} />;
} 