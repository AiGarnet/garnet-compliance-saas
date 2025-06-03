import { ChatClient } from './client';

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

export default function ChatPage({ params }: { params: { id: string } }) {
  return <ChatClient id={params.id} />;
} 