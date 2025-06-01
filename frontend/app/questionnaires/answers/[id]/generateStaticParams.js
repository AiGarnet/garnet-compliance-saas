// Generate static params for questionnaires/answers/[id] route
export async function generateStaticParams() {
  // Pre-render with a sample ID
  return [
    { id: 'sample-questionnaire' }
  ];
} 