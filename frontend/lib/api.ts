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
      case '/api/vendors':
        return '/.netlify/functions/vendors';
      case '/api/vendors/stats':
        return '/.netlify/functions/vendor-stats';
      default:
        // Handle vendor ID routes
        if (path.startsWith('/api/vendors/') && path.split('/').length === 4) {
          const vendorId = path.split('/')[3];
          return `/.netlify/functions/vendor-by-id?id=${vendorId}`;
        }
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