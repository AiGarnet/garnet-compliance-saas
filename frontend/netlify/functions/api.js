// Netlify function to handle API requests
import { NextRequest } from 'next/server';

// This file is used to adapt Next.js API routes to Netlify Functions

export default async (req) => {
  try {
    // Create a NextRequest from the Netlify request
    const nextReq = new NextRequest(req.url, {
      headers: req.headers,
      method: req.method,
      body: req.body,
    });

    // Determine the path based on URL
    const url = new URL(req.url);
    const path = url.pathname;

    // Authentication routes
    if (path.startsWith('/api/auth/signup')) {
      const { default: handler } = await import('../../app/api/auth/signup/route');
      return await handler.POST(nextReq);
    } 
    
    if (path.startsWith('/api/auth/login')) {
      const { default: handler } = await import('../../app/api/auth/login/route');
      return await handler.POST(nextReq);
    }

    // Default response for unhandled routes
    return new Response(JSON.stringify({ error: 'Route not found' }), {
      status: 404,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('API function error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}; 