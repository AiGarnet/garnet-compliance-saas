// Helper function to get the correct API endpoint
export function getApiEndpoint(path: string): string {
  // Check if we're running on Netlify (static site) - check for multiple domains
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('garnetai.net') ||
     window.location.hostname.includes('testinggarnet.netlify.app'));
  
  // For Netlify, use function endpoints directly
  if (isNetlify) {
    switch (path) {
      case '/api/auth/signup':
        return '/.netlify/functions/auth-signup';
      case '/api/auth/login':
        return '/.netlify/functions/auth-login';
      default:
        return path;
    }
  }
  
  // For local development, use the original API routes
  return path;
}

// API helper functions
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  const url = getApiEndpoint(endpoint);
  
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Network error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const auth = {
  signup: (data: any) => apiCall('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data: any) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
}; 