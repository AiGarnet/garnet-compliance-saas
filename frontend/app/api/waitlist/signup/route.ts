export const dynamic = "force-static";

import { NextResponse } from 'next/server';

// For static export we need to provide a static response
export async function POST() {
  // Return mock data for static export
  return NextResponse.json({
    success: true,
    message: "Signup processed successfully"
  });
} 