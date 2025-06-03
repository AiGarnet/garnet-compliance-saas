import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Add generateStaticParams for static export
export async function generateStaticParams() {
  // Return an empty array since this is a dynamic route that will be 
  // handled client-side and doesn't need pre-rendered paths
  return [];
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'Questionnaire ID is required' },
        { status: 400 }
      );
    }

    // In a real application, you would fetch this from a database
    // For now, we'll return mock data
    
    // Generate some mock questions based on the ID
    const questionCount = Math.floor(Math.random() * 10) + 5; // 5-15 questions
    const questions = Array.from({ length: questionCount }).map((_, index) => ({
      id: `${id}_q_${index}`,
      text: `Question ${index + 1}: How does your organization handle security compliance requirements?`,
      answer: index % 2 === 0 ? 'Our organization maintains strict security protocols in compliance with industry standards like ISO 27001, SOC 2, and GDPR.' : '',
    }));

    return NextResponse.json({
      id,
      title: `Security Questionnaire #${id.split('_').pop()}`,
      questions,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
} 