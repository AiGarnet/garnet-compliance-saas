import { NextResponse, type NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // Using jose instead of jsonwebtoken in edge runtime

// Pages that don't require authentication
const publicPaths = [
  '/',
  '/api/auth/signup',
  '/api/auth/login',
];

// Secret key for JWT tokens (use an environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }
  
  // Check for authentication token
  const token = request.cookies.get('garnet_auth_token')?.value;

  // If no token, redirect to login
  if (!token) {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  try {
    // Verify token with jose (middleware runs in edge runtime where jsonwebtoken isn't available)
    const encoder = new TextEncoder();
    await jwtVerify(token, encoder.encode(JWT_SECRET));
    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to login
    const url = request.nextUrl.clone();
    url.pathname = '/';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }
}

export const config = {
  matcher: [
    // Add paths that require authentication
    '/dashboard/:path*',
    '/admin/:path*',
    '/questionnaires/:path*',
    '/compliance/:path*',
    '/vendors/:path*',
  ],
}; 