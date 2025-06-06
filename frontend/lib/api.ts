// API configuration and helpers
const API_ENDPOINTS = {
  // Netlify function endpoints (for auth)
  '/api/auth/signup': '/.netlify/functions/auth-signup',
  '/api/auth/login': '/.netlify/functions/auth-login',
  
  // Direct Railway endpoints (for other APIs)
  '/join-waitlist': '/join-waitlist',
  '/api/answer': '/api/answer',
  '/batch-ask': '/batch-ask',
};

function getBaseUrl(): string {
  if (typeof window === 'undefined') {
    // Server-side: use environment variable or default
    return process.env.NEXT_PUBLIC_API_URL || 'https://garnet-compliance-saas-production.up.railway.app';
  }
  
  // Client-side: detect domain
  const hostname = window.location.hostname;
  
  if (hostname === 'garnetai.net' || hostname === 'www.garnetai.net') {
    return 'https://www.garnetai.net';
  } else if (hostname.includes('netlify.app')) {
    return `https://${hostname}`;
  } else if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000';
  } else {
    // Fallback to Railway backend
    return 'https://garnet-compliance-saas-production.up.railway.app';
  }
}

function getApiUrl(endpoint: string): string {
  const baseUrl = getBaseUrl();
  
  // Check if this endpoint should use Netlify functions
  if (API_ENDPOINTS[endpoint as keyof typeof API_ENDPOINTS]) {
    const netlifyEndpoint = API_ENDPOINTS[endpoint as keyof typeof API_ENDPOINTS];
    
    // For auth endpoints, use Netlify functions
    if (endpoint.startsWith('/api/auth/')) {
      return `${baseUrl}${netlifyEndpoint}`;
    }
  }
  
  // For other endpoints, use Railway backend directly
  return `https://garnet-compliance-saas-production.up.railway.app${endpoint}`;
}

async function apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  const url = getApiUrl(endpoint);
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, { ...defaultOptions, ...options });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// API methods
export const api = {
  // Authentication
  signup: (data: any) => apiCall('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  login: (data: any) => apiCall('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Waitlist
  joinWaitlist: (data: any) => apiCall('/join-waitlist', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  
  // Questionnaire
  askQuestion: (question: string) => apiCall('/api/answer', {
    method: 'POST',
    body: JSON.stringify({ question }),
  }),
  
  batchAsk: (questions: string[]) => apiCall('/batch-ask', {
    method: 'POST',
    body: JSON.stringify({ questions }),
  }),
};

export default api; 