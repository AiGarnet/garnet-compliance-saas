"use client";

/**
 * Authentication service for handling user authentication in the frontend
 */
// Remove the server-only import
// import { cookies } from 'next/headers';

// Types
export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  organization?: string;
  created_at: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  full_name: string;
  role: string;
  organization?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Cookie and storage keys
const TOKEN_KEY = 'garnet_auth_token';
const USER_KEY = 'garnet_user';

/**
 * Set auth token in cookies
 */
export function setAuthCookie(token: string) {
  // For client-side operations only
  if (typeof document !== 'undefined') {
    document.cookie = `${TOKEN_KEY}=${token}; path=/; max-age=604800; SameSite=Strict; Secure`;
  }
  
  // Remove server-side cookie setting code
  // try {
  //   const cookieStore = cookies();
  //   cookieStore.set(TOKEN_KEY, token, {
  //     maxAge: 60 * 60 * 24 * 7, // 1 week
  //     path: '/',
  //     secure: process.env.NODE_ENV === 'production',
  //     sameSite: 'strict',
  //   });
  // } catch (e) {
  //   // This will fail in client components, which is expected
  // }
}

/**
 * Sign up a new user
 */
export async function signup(userData: SignupRequest): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to sign up');
    }

    const data = await response.json();
    
    // Store token in cookie for better security
    setAuthCookie(data.token);
    
    // Store user data in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
}

/**
 * Log in a user
 */
export async function login(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to log in');
    }

    const data = await response.json();
    
    // Store token in cookie for better security
    setAuthCookie(data.token);
    
    // Store user data in localStorage
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
}

/**
 * Log out the current user
 */
export function logout(): void {
  // Clear the cookie
  document.cookie = `${TOKEN_KEY}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure`;
  
  // Clear localStorage
  localStorage.removeItem(USER_KEY);
  
  // Redirect to home page
  window.location.href = '/';
}

/**
 * Get the current authenticated user
 */
export function getCurrentUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  const userJson = localStorage.getItem(USER_KEY);
  if (!userJson) {
    return null;
  }
  
  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

/**
 * Get the authentication token from cookies
 */
export function getToken(): string | null {
  if (typeof document === 'undefined') {
    return null;
  }
  
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === TOKEN_KEY) {
      return value;
    }
  }
  
  return null;
}

/**
 * Check if a user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

/**
 * Helper to get auth headers for API requests
 */
export function getAuthHeaders(): HeadersInit {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
} 