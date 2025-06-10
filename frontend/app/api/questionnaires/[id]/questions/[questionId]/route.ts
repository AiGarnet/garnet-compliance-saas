import { NextRequest, NextResponse } from 'next/server';

interface QuestionAnswer {
  question: string;
  answer: string;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { id, questionId } = params;
    
    // For static export, return mock question data
    // In a real implementation, this would fetch from database
    const mockQuestion: QuestionAnswer = {
      question: `Sample question ${questionId} for questionnaire ${id}`,
      answer: ''
    };
    
    return NextResponse.json(mockQuestion);
  } catch (error) {
    console.error('Error fetching question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { id, questionId } = params;
    const body = await request.json();
    const { question, answer } = body;
    
    // For static export, just return the updated question
    // In a real implementation, this would update the database
    const updatedQuestion: QuestionAnswer = {
      question: question || `Updated question ${questionId}`,
      answer: answer || ''
    };
    
    // Return the updated questionnaire structure
    const updatedQuestionnaire = {
      id,
      name: `Questionnaire ${id}`,
      status: 'In Progress',
      progress: 50,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      answers: [updatedQuestion], // In real implementation, this would be the full answers array
      updatedAt: new Date().toISOString()
    };
    
    return NextResponse.json(updatedQuestionnaire);
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; questionId: string } }
) {
  try {
    const { id, questionId } = params;
    
    // For static export, just return success
    // In a real implementation, this would delete from database
    return NextResponse.json({ 
      message: `Question ${questionId} deleted from questionnaire ${id}` 
    });
  } catch (error) {
    console.error('Error deleting question:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 