import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NODE_ENV === 'production' 
  ? 'https://garnet-compliance-saas-production.up.railway.app'
  : 'http://localhost:5000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/vendors/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to fetch vendor stats' }));
      return NextResponse.json(error, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching vendor stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendor stats' },
      { status: 500 }
    );
  }
} 