import { Vendor, RiskLevel, VendorStatus } from '../types/vendor.types';
import { getAllVendors, getVendorById } from '../data/vendors';

/**
 * Vendor Service
 * Contains utility functions for working with vendor data
 */
export const VendorService = {
  /**
   * Get all vendors
   */
  getAllVendors,
  
  /**
   * Get a vendor by ID
   */
  getVendorById,
  
  /**
   * Get vendors filtered by status
   * @param status - The status to filter by
   */
  getVendorsByStatus(status: VendorStatus): Vendor[] {
    return getAllVendors().filter(vendor => vendor.status === status);
  },
  
  /**
   * Get vendors filtered by risk level
   * @param riskLevel - The risk level to filter by
   */
  getVendorsByRiskLevel(riskLevel: RiskLevel): Vendor[] {
    return getAllVendors().filter(vendor => vendor.riskLevel === riskLevel);
  },
  
  /**
   * Get high risk vendors (convenience method)
   */
  getHighRiskVendors(): Vendor[] {
    return this.getVendorsByRiskLevel(RiskLevel.HIGH);
  },
  
  /**
   * Calculate average risk score across all vendors
   */
  getAverageRiskScore(): number {
    const vendors = getAllVendors();
    if (vendors.length === 0) return 0;
    
    const totalScore = vendors.reduce((sum, vendor) => sum + vendor.riskScore, 0);
    return totalScore / vendors.length;
  },
  
  /**
   * Count vendors by status
   * Returns an object with counts for each status
   */
  countVendorsByStatus(): Record<VendorStatus, number> {
    const vendors = getAllVendors();
    const counts = {
      [VendorStatus.QUESTIONNAIRE_PENDING]: 0,
      [VendorStatus.IN_REVIEW]: 0,
      [VendorStatus.PENDING_REVIEW]: 0,
      [VendorStatus.APPROVED]: 0
    };
    
    vendors.forEach(vendor => {
      counts[vendor.status]++;
    });
    
    return counts;
  }
}; 