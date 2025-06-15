export interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  role?: string;
  organization?: string;
  created_at: Date;
}

export interface CreateWaitlistEntryRequest {
  name: string;
  email: string;
  role?: string;
  organization?: string;
} 