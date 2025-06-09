// Helper function to get the correct API endpoint
export function getApiEndpoint(path: string): string {
  // Check if we're running on Netlify (static site) - check for multiple domains
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('garnetai.net') ||
     window.location.hostname.includes('testinggarnet.netlify.app'));
  
  // For vendor API calls, always use Railway backend (even on Netlify)
  if (path.startsWith('/api/vendors')) {
    const RAILWAY_URL = process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app';
    return `${RAILWAY_URL}${path}`;
  }
  
  // For Netlify, use function endpoints for auth and other non-vendor APIs
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
  
  // For local development, use the backend server URL
  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const BACKEND_URL = isDevelopment 
    ? (process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080')
    : (process.env.NEXT_PUBLIC_RAILWAY_BACKEND_URL || 'https://garnet-compliance-saas-production.up.railway.app');
  
  return `${BACKEND_URL}${path}`;
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

// Vendor API functions
export const vendors = {
  // Get all vendors
  getAll: () => apiCall('/api/vendors'),
  
  // Get vendor by ID
  getById: (id: string) => apiCall(`/api/vendors/${id}`),
  
  // Create new vendor
  create: (data: any) => apiCall('/api/vendors', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Update vendor
  update: (id: string, data: any) => apiCall(`/api/vendors/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),
  
  // Delete vendor
  delete: (id: string) => apiCall(`/api/vendors/${id}`, {
    method: 'DELETE',
  }),
  
  // Get vendors by status
  getByStatus: (status: string) => apiCall(`/api/vendors/status/${status}`),
  
  // Get vendor statistics
  getStats: () => apiCall('/api/vendors/stats'),
};

// Test functions
export const test = {
  // Test database connection
  testDatabase: () => apiCall('/api/test-db'),
  
  // Test general backend connectivity
  ping: () => apiCall('/ping'),
}; 