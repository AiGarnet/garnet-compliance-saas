/**
 * Dashboard statistics interface
 */
export interface DashboardStats {
  totalVendors: number;
  totalQuestionnaires: number;
  totalTrustPortalViews: number;
  vendorsByStatus: VendorStatusStats[];
  recentActivity: ActivityItem[];
  complianceOverview: ComplianceStats;
}

/**
 * Vendor status statistics
 */
export interface VendorStatusStats {
  status: string;
  count: number;
  percentage: number;
}

/**
 * Activity item for recent activity feed
 */
export interface ActivityItem {
  id: string;
  type: 'vendor_created' | 'questionnaire_completed' | 'evidence_uploaded' | 'trust_portal_updated';
  description: string;
  timestamp: Date;
  vendorId?: number;
  vendorName?: string;
}

/**
 * Compliance statistics
 */
export interface ComplianceStats {
  totalAnswers: number;
  compliantCount: number;
  nonCompliantCount: number;
  partialCount: number;
  naCount: number;
  complianceRate: number;
}

/**
 * Vendor analytics data
 */
export interface VendorAnalytics {
  vendorId: number;
  companyName: string;
  status: string;
  riskScore: number;
  riskLevel: string;
  questionnaireProgress: number;
  evidenceCount: number;
  trustPortalItems: number;
  lastActivity: Date;
}

/**
 * Time-based analytics
 */
export interface TimeBasedAnalytics {
  period: string;
  vendorsCreated: number;
  questionnairesCompleted: number;
  evidenceUploaded: number;
  trustPortalViews: number;
}

/**
 * Risk distribution analytics
 */
export interface RiskDistribution {
  riskLevel: 'Low' | 'Medium' | 'High';
  count: number;
  percentage: number;
  averageScore: number;
} 