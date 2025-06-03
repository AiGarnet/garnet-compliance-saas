import { NextResponse } from 'next/server';

// For static export we need to provide a static response
// since API routes can't be truly dynamic in static exports
export async function GET() {
  // Return mock data for static export
  return NextResponse.json({
    totalSignups: 0,
    activeUsers: 0,
    pendingInvites: 0,
    lastUpdated: new Date().toISOString()
  });
} 