import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, questions } = body;
    
    // Generate a random ID
    const id = `q${Date.now().toString(36)}`;
    
    // Generate a random due date in the next 30 days
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + Math.floor(Math.random() * 30) + 1);
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
    
    // Store the questionnaire in memory (in a real app, this would go to a database)
    // In this demo, we'll just return a mock response since we can't persist data between requests
    
    return NextResponse.json({
      success: true,
      message: 'Questionnaire created successfully',
      questionnaire: {
        id,
        name: title,
        status: 'Not Started',
        dueDate: formattedDueDate,
        progress: 0,
        questions
      }
    });
  } catch (error) {
    console.error('Error processing questionnaire:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to process questionnaire' },
      { status: 500 }
    );
  }
} 