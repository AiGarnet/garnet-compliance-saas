import { NextResponse } from 'next/server';

// Remove dynamic export for static compatibility
// export const dynamic = 'force-dynamic';

// Define types for our mock data
interface Question {
  id: string;
  text: string;
  answer: string;
}

interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// Create a mock database that can be used during static export
const mockQuestionnaires: Record<string, Questionnaire> = {
  'q_123': {
    id: 'q_123',
    title: 'Security Questionnaire #123',
    questions: [
      { id: 'q_123_q_0', text: 'Question 1: How does your organization handle security compliance requirements?', answer: 'Our organization maintains strict security protocols in compliance with industry standards like ISO 27001, SOC 2, and GDPR.' },
      { id: 'q_123_q_1', text: 'Question 2: Do you have a dedicated security team?', answer: '' },
      { id: 'q_123_q_2', text: 'Question 3: How often do you conduct security audits?', answer: 'Our organization maintains a regular audit schedule in compliance with industry standards.' },
    ],
    createdAt: '2023-05-15T10:30:00Z',
    updatedAt: '2023-05-20T14:45:00Z',
  },
  'q_456': {
    id: 'q_456',
    title: 'Security Questionnaire #456',
    questions: [
      { id: 'q_456_q_0', text: 'Question 1: Describe your data protection measures', answer: 'We implement encryption at rest and in transit, access controls, and regular security audits.' },
      { id: 'q_456_q_1', text: 'Question 2: How do you handle security incidents?', answer: '' },
    ],
    createdAt: '2023-06-10T09:15:00Z',
    updatedAt: '2023-06-12T16:20:00Z',
  }
};

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

    // Check if we have this questionnaire in our mock database
    if (mockQuestionnaires[id]) {
      return NextResponse.json(mockQuestionnaires[id]);
    }

    // If not in mock DB, generate a mock response
    // Generate some mock questions based on the ID
    const questionCount = 5; // Fixed count for static generation
    const questions = Array.from({ length: questionCount }).map((_, index) => ({
      id: `${id}_q_${index}`,
      text: `Question ${index + 1}: How does your organization handle security compliance requirements?`,
      answer: index % 2 === 0 ? 'Our organization maintains strict security protocols in compliance with industry standards like ISO 27001, SOC 2, and GDPR.' : '',
    }));

    const mockQuestionnaire: Questionnaire = {
      id,
      title: `Security Questionnaire #${id.split('_').pop() || '0'}`,
      questions,
      createdAt: '2023-01-01T00:00:00Z', // Fixed date for static generation
      updatedAt: '2023-01-01T00:00:00Z',
    };

    return NextResponse.json(mockQuestionnaire);
  } catch (error) {
    console.error('Error fetching questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questionnaire' },
      { status: 500 }
    );
  }
} 