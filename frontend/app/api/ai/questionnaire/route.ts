import { NextRequest, NextResponse } from 'next/server';

// Set to static generation compatibility
// export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, questions } = body;
    
    if (!title || !questions || !Array.isArray(questions)) {
      return NextResponse.json({ error: 'Title and questions array are required' }, { status: 400 });
    }
    
    // Use a deterministic ID for static generation
    const id = `q_${title.replace(/\s+/g, '_').toLowerCase().substring(0, 10)}_${questions.length}`;
    
    // Create questionnaire object with static data for export compatibility
    const questionnaire = {
      id,
      name: title,
      dueDate: '2023-12-31', // Static date for export
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