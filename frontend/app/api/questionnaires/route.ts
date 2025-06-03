import { NextResponse } from 'next/server';

// Remove dynamic export for static compatibility
// export const dynamic = 'force-dynamic';

// Define types for our mock data
interface Question {
  id: string;
  text: string;
  answer?: string;
}

interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  updatedAt?: string;
}

// Mock database for static export
const mockQuestionnaires: Record<string, Questionnaire> = {
  'q_123': {
    id: 'q_123',
    title: 'Security Questionnaire #123',
    questions: [
      { id: 'q_123_q_0', text: 'Question 1: How does your organization handle security compliance requirements?' },
      { id: 'q_123_q_1', text: 'Question 2: Do you have a dedicated security team?' },
      { id: 'q_123_q_2', text: 'Question 3: How often do you conduct security audits?' },
    ],
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-20T14:45:00Z',
  },
  'q_456': {
    id: 'q_456',
    title: 'Security Questionnaire #456',
    questions: [
      { id: 'q_456_q_0', text: 'Question 1: Describe your data protection measures' },
      { id: 'q_456_q_1', text: 'Question 2: How do you handle security incidents?' },
    ],
    createdAt: '2023-06-10T09:15:00Z',
    updatedAt: '2023-06-12T16:20:00Z',
  }
};

// GET handler to list all questionnaires
export async function GET() {
  return NextResponse.json(Object.values(mockQuestionnaires));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, questions } = body;

    // Validate the input
    if (!title || !title.trim()) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least one question is required' },
        { status: 400 }
      );
    }

    // In a real application, you would save this to a database
    // For now, we'll generate a unique ID and return it
    const id = `q_${Date.now()}`;

    // Create a mock response with properly typed data
    const newQuestionnaire: Questionnaire = {
      id,
      title,
      questions: questions.map((q: any, index: number) => ({
        id: `${id}_q_${index}`,
        text: typeof q === 'string' ? q : q.text || q.question || '',
      })),
      createdAt: '2023-01-01T00:00:00Z', // Fixed date for static generation
    };

    return NextResponse.json(newQuestionnaire);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to create questionnaire' },
      { status: 500 }
    );
  }
} 