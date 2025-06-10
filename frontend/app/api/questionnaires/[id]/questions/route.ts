import { NextRequest, NextResponse } from 'next/server';

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

interface QuestionAnswer {
  question: string;
  answer: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // For static export, return mock questions
    // In a real implementation, this would fetch from database
    const mockQuestions: QuestionAnswer[] = [
      {
        question: `Sample question 1 for questionnaire ${id}`,
        answer: ''
      },
      {
        question: `Sample question 2 for questionnaire ${id}`,
        answer: ''
      }
    ];
    
    return NextResponse.json(mockQuestions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { questions } = body;
    
    if (!questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Questions array is required' }, { status: 400 });
    }
    
    // For static export, just return the questions
    // In a real implementation, this would save to database
    const savedQuestions: QuestionAnswer[] = questions.map((q: string) => ({
      question: q,
      answer: ''
    }));
    
    return NextResponse.json(savedQuestions);
  } catch (error) {
    console.error('Error saving questions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 