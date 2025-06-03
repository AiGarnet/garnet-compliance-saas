// Using a static implementation for compatibility with static export

// For static export we need to provide a static response
import { NextResponse } from 'next/server';

export async function POST() {
  // Return mock data for static export
  return NextResponse.json({
    success: true,
    message: "Signup processed successfully"
  });
} 