import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { 
  DashboardStats, 
  VendorStatusStats, 
  ActivityItem, 
  ComplianceStats,
  VendorAnalytics,
  TimeBasedAnalytics,
  RiskDistribution
} from './entities/analytics.entity';
import { AnalyticsQueryDto } from './dto/analytics.dto';

@Injectable()
export class AnalyticsService {
  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * Get comprehensive dashboard statistics
   */
  async getDashboardStats(): Promise<DashboardStats> {
    const [
      totalVendors,
      totalQuestionnaires,
      vendorsByStatus,
      recentActivity,
      complianceOverview
    ] = await Promise.all([
      this.getTotalVendors(),
      this.getTotalQuestionnaires(),
      this.getVendorsByStatus(),
      this.getRecentActivity(),
      this.getComplianceOverview()
    ]);

    return {
      totalVendors,
      totalQuestionnaires,
      totalTrustPortalViews: 127, // Mock data - would come from analytics tracking
      vendorsByStatus,
      recentActivity,
      complianceOverview
    };
  }

  /**
   * Get total number of vendors
   */
  async getTotalVendors(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM vendors`;
    const result = await this.databaseService.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get total number of questionnaires
   */
  async getTotalQuestionnaires(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM questionnaires`;
    const result = await this.databaseService.query(query);
    return parseInt(result.rows[0].count);
  }

  /**
   * Get vendor distribution by status
   */
  async getVendorsByStatus(): Promise<VendorStatusStats[]> {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM vendors 
      GROUP BY status
      ORDER BY count DESC
    `;
    
    const result = await this.databaseService.query(query);
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    return result.rows.map(row => ({
      status: row.status,
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0
    }));
  }

  /**
   * Get recent activity (mock data for now)
   */
  async getRecentActivity(): Promise<ActivityItem[]> {
    // This would typically come from an audit log table
    // For now, returning mock data based on recent database changes
    const vendorsQuery = `
      SELECT 
        vendor_id,
        company_name,
        created_at
      FROM vendors 
      ORDER BY created_at DESC 
      LIMIT 5
    `;
    
    const vendorsResult = await this.databaseService.query(vendorsQuery);
    
    const activities: ActivityItem[] = vendorsResult.rows.map((vendor, index) => ({
      id: `activity-${vendor.vendor_id}-${index}`,
      type: 'vendor_created' as const,
      description: `New vendor "${vendor.company_name}" was added to the system`,
      timestamp: new Date(vendor.created_at),
      vendorId: vendor.vendor_id,
      vendorName: vendor.company_name
    }));

    return activities;
  }

  /**
   * Get compliance overview statistics
   */
  async getComplianceOverview(): Promise<ComplianceStats> {
    // This would come from questionnaire answers analysis
    // For now, returning mock data
    return {
      totalAnswers: 0,
      compliantCount: 0,
      nonCompliantCount: 0,
      partialCount: 0,
      naCount: 0,
      complianceRate: 0
    };
  }

  /**
   * Get vendor analytics data
   */
  async getVendorAnalytics(query?: AnalyticsQueryDto): Promise<VendorAnalytics[]> {
    const vendorsQuery = `
      SELECT 
        v.vendor_id,
        v.company_name,
        v.status,
        v.risk_score,
        v.risk_level,
        v.created_at,
        v.updated_at,
        COALESCE(tp_count.count, 0) as trust_portal_items
      FROM vendors v
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM trust_portal_items 
        GROUP BY vendor_id
      ) tp_count ON v.vendor_id = tp_count.vendor_id
      ORDER BY v.created_at DESC
    `;
    
    const result = await this.databaseService.query(vendorsQuery);
    
    return result.rows.map(row => ({
      vendorId: row.vendor_id,
      companyName: row.company_name,
      status: row.status,
      riskScore: row.risk_score || 50,
      riskLevel: row.risk_level || 'Medium',
      questionnaireProgress: 0, // Would calculate from questionnaire completion
      evidenceCount: 0, // Would count from evidence_files table
      trustPortalItems: parseInt(row.trust_portal_items),
      lastActivity: new Date(row.updated_at)
    }));
  }

  /**
   * Get time-based analytics
   */
  async getTimeBasedAnalytics(query?: AnalyticsQueryDto): Promise<TimeBasedAnalytics[]> {
    const period = query?.period || '7d';
    const days = this.getPeriodDays(period);
    
    const analyticsQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as vendors_created
      FROM vendors 
      WHERE created_at >= NOW() - INTERVAL '${days} days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await this.databaseService.query(analyticsQuery);
    
    return result.rows.map(row => ({
      period: row.date,
      vendorsCreated: parseInt(row.vendors_created),
      questionnairesCompleted: 0, // Would calculate from questionnaire completion
      evidenceUploaded: 0, // Would calculate from evidence uploads
      trustPortalViews: Math.floor(Math.random() * 50) // Mock data
    }));
  }

  /**
   * Get risk distribution analytics
   */
  async getRiskDistribution(): Promise<RiskDistribution[]> {
    const query = `
      SELECT 
        risk_level,
        COUNT(*) as count,
        AVG(risk_score) as avg_score
      FROM vendors 
      WHERE risk_level IS NOT NULL
      GROUP BY risk_level
      ORDER BY 
        CASE risk_level 
          WHEN 'Low' THEN 1 
          WHEN 'Medium' THEN 2 
          WHEN 'High' THEN 3 
        END
    `;
    
    const result = await this.databaseService.query(query);
    const total = result.rows.reduce((sum, row) => sum + parseInt(row.count), 0);
    
    return result.rows.map(row => ({
      riskLevel: row.risk_level as 'Low' | 'Medium' | 'High',
      count: parseInt(row.count),
      percentage: total > 0 ? Math.round((parseInt(row.count) / total) * 100) : 0,
      averageScore: Math.round(parseFloat(row.avg_score) || 0)
    }));
  }

  /**
   * Get analytics for a specific vendor
   */
  async getVendorSpecificAnalytics(vendorId: number): Promise<VendorAnalytics> {
    const query = `
      SELECT 
        v.vendor_id,
        v.company_name,
        v.status,
        v.risk_score,
        v.risk_level,
        v.created_at,
        v.updated_at,
        COALESCE(tp_count.count, 0) as trust_portal_items,
        COALESCE(ev_count.count, 0) as evidence_count
      FROM vendors v
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM trust_portal_items 
        WHERE vendor_id = $1
        GROUP BY vendor_id
      ) tp_count ON v.vendor_id = tp_count.vendor_id
      LEFT JOIN (
        SELECT vendor_id, COUNT(*) as count 
        FROM evidence_files 
        WHERE vendor_id = $1
        GROUP BY vendor_id
      ) ev_count ON v.vendor_id = ev_count.vendor_id
      WHERE v.vendor_id = $1
    `;
    
    const result = await this.databaseService.query(query, [vendorId]);
    
    if (result.rows.length === 0) {
      throw new Error('Vendor not found');
    }
    
    const row = result.rows[0];
    
    return {
      vendorId: row.vendor_id,
      companyName: row.company_name,
      status: row.status,
      riskScore: row.risk_score || 50,
      riskLevel: row.risk_level || 'Medium',
      questionnaireProgress: 0, // Would calculate from questionnaire completion
      evidenceCount: parseInt(row.evidence_count),
      trustPortalItems: parseInt(row.trust_portal_items),
      lastActivity: new Date(row.updated_at)
    };
  }

  /**
   * Helper method to convert period string to days
   */
  private getPeriodDays(period: string): number {
    switch (period) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 7;
    }
  }
} 