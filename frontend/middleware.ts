// Middleware is disabled for static export (Netlify deployment)
// Authentication is handled client-side via useAuthGuard hook

// This file is kept for development mode only
// For static export, authentication is handled in individual components

export function middleware() {
  // No-op for static export
  return;
}

export const config = {
  matcher: [],
}; 