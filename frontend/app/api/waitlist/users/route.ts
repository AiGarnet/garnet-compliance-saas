import { NextResponse } from 'next/server';

// For static export we need to provide a static response
export async function GET() {
  // Return mock data for static export
  return NextResponse.json({
    users: [
      { id: '1', name: 'Demo User', email: 'demo@example.com', status: 'Active' },
      { id: '2', name: 'Test User', email: 'test@example.com', status: 'Pending' }
    ]
  });
} 