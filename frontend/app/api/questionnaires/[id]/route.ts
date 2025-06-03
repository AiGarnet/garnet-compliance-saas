import { NextResponse } from 'next/server';

// For static export, we use static data instead of dynamic API routes
// Remove 'force-dynamic' and implement static alternatives

// Add generateStaticParams to support static export
export async function generateStaticParams() {
  // Return all possible IDs that this API route needs to handle
  const ids = [
    'demo_1',
    'demo_2', 
    'demo_3',
    'q_100',
    'q_101',
    'q_102',
    'q_security_assessment',
    'q_vendor_onboarding',
    'q_compliance_review',
    'q_risk_assessment',
    'q_data_protection',
    'q_2023_audit',
    'q_2024_audit'
  ];
  
  // Make sure each id is returned as a string in the proper format
  return ids.map(id => ({ id: String(id) }));
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