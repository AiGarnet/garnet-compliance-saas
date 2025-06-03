import { NextResponse } from 'next/server';

// For static export, we use static data instead of dynamic API routes
// Remove 'force-dynamic' and implement static alternatives

export async function POST(req: Request) {
  // For static builds, you would typically:
  // 1. Use client-side state management instead of API routes
  // 2. Or use Netlify functions for dynamic functionality
  
  // This API function will be pre-rendered at build time
  // Client-side code should handle this limitation

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

    // Store in localStorage for persistence (this is just a simple example)
    // In a real application, you would use a database
    
    // For now, we'll use a dummy response
    return NextResponse.json({
      id,
      title,
      questions: questions.map((q, index) => ({
        id: `${id}_q_${index}`,
        text: typeof q === 'string' ? q : q.text || q.question,
      })),
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error creating questionnaire:', error);
    return NextResponse.json(
      { error: 'Failed to create questionnaire' },
      { status: 500 }
    );
  }
} 