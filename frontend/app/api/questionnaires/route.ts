import { NextRequest, NextResponse } from 'next/server';

// For static export, we use static data instead of dynamic API routes
// Remove 'force-dynamic' and implement static alternatives

interface QuestionAnswer {
  question: string;
  answer: string;
}

interface QuestionnaireData {
  title: string;
  questions: string[];
  answers?: QuestionAnswer[];
}

export async function POST(request: NextRequest) {
  // For static builds, you would typically:
  // 1. Use client-side state management instead of API routes
  // 2. Or use Netlify functions for dynamic functionality
  
  // This API function will be pre-rendered at build time
  // Client-side code should handle this limitation

  try {
    const body: QuestionnaireData = await request.json();
    const { title, questions, answers } = body;
    
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: 'Title and questions array are required' }, { status: 400 });
    }
    
    // Generate a unique ID
    const id = `q${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
    
    // Create questionnaire object
    const questionnaire = {
      id,
      name: title,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      status: 'Not Started',
      progress: 0,
      answers: answers || questions.map((question: string) => ({
        question,
        answer: '' // Empty answer to be filled later
      }))
    };
    
    return NextResponse.json(questionnaire);
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // For now, return empty array as questionnaires are stored in localStorage
    // In a real implementation, this would fetch from database
    return NextResponse.json([]);
  } catch (error) {
    console.error('Error fetching questionnaires:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 