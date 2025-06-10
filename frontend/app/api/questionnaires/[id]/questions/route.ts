import { NextRequest, NextResponse } from 'next/server';

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