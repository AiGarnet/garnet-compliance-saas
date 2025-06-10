import { NextRequest, NextResponse } from 'next/server';

// Add generateStaticParams to support static export
export async function generateStaticParams() {
  // Return all possible combinations of id and questionId that this API route needs to handle
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
  
  const questionIds = ['1', '2', '3', '4', '5', '6', '7', '8'];
  
  // Generate all combinations of id and questionId
  const params = [];
  for (const id of ids) {
    for (const questionId of questionIds) {
      params.push({ id: String(id), questionId: String(questionId) });
    }
  }
  
  return params;
}

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