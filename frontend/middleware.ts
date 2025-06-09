import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/auth/login',
  '/auth/signup',
  '/privacy',
  '/terms',
  '/privacy-policy',
  '/terms-of-service',
  '/api/auth/login',
  '/api/auth/signup',
  '/api/auth/logout'
];

// Define routes that should redirect to login if not authenticated
const protectedRoutes = [
  '/dashboard',
  '/questionnaires',
  '/vendors',
  '/compliance',
  '/trust-portal',
  '/admin',
  '/accessibility',
  '/theme-example',
  '/design-tokens'
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(route);
  });

  // Allow public routes to proceed
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check for authentication token
  const token = request.cookies.get('authToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  // If no token found, redirect to login with the intended destination
  if (!token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Allow authenticated users to proceed
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|IconOnly_Transparent_NoBuffer.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}; 