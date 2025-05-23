import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, questions } = body;
    
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Title and questions array are required' }, { status: 400 });
    }
    
    // Generate a random ID
    const id = `q${Date.now().toString(36)}${Math.random().toString(36).substr(2, 5)}`;
    
    // Create questionnaire object
    const questionnaire = {
      id,
      name: title,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      status: 'In Progress',
      answers: questions.map((question: string) => ({
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