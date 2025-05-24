import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get the environment
    const isNetlify = process.env.NETLIFY === 'true';
    
    let response;
    
    if (isNetlify) {
      // When deployed on Netlify, the function is already available through /.netlify/functions/
      response = await fetch('/.netlify/functions/waitlist-signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } else {
      // Use the backend server API
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      response = await fetch(`${backendUrl}/api/waitlist/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    }
    
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
} 