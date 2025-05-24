import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // When running on Netlify, the function is handled by Netlify Functions
  // This route only runs for local development
  if (process.env.NETLIFY === 'true') {
    return NextResponse.json(
      { error: 'This route is handled by Netlify Functions in production' }, 
      { status: 307, headers: { 'Location': '/.netlify/functions/api' } }
    );
  }

  try {
    const body = await req.json();
    const { email, password, full_name, role, organization } = body;

    // Forward request to the API endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, full_name, role, organization }),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('Error in signup route:', error);
    return NextResponse.json(
      { error: 'Failed to process signup request' },
      { status: 500 }
    );
  }
} 