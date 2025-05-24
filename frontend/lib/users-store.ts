/**
 * In-memory users store for backward compatibility
 */

export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  organization: string | null;
  created_at: string;
  updated_at: string;
}

// Simulated user database in memory (for backward compatibility)
export let users: User[] = []; 