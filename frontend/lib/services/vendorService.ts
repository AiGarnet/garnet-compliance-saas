import { Vendor, RiskLevel, VendorStatus, QuestionnaireAnswer } from '../types/vendor.types';
import { apiClient } from './api';
import { v4 as uuidv4 } from 'uuid';

/**
 * Vendor Service
 * Contains utility functions for working with vendor data via API
 */
export const VendorService = {
  /**
   * Get all vendors
   */
  async getAllVendors(): Promise<Vendor[]> {
    try {
      const response = await apiClient.get<{ vendors: Vendor[] }>('/api/vendors');
      return response.vendors;
    } catch (error) {
      console.error('Error fetching vendors:', error);
      return [];
    }
  },
  
  /**
   * Get a vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    try {
      const response = await apiClient.get<{ vendor: Vendor }>(`/api/vendors/${id}`);
      return response.vendor;
    } catch (error) {
      console.error(`Error fetching vendor ${id}:`, error);
      return null;
    }
  },
  
  /**
   * Get vendors filtered by status
   */
  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    try {
      const response = await apiClient.get<{ vendors: Vendor[] }>(`/api/vendors/status/${status}`);
      return response.vendors;
    } catch (error) {
      console.error(`Error fetching vendors with status ${status}:`, error);
      return [];
    }
  },
  
  /**
   * Get vendors filtered by risk level
   * @param riskLevel - The risk level to filter by
   */
  async getVendorsByRiskLevel(riskLevel: RiskLevel): Promise<Vendor[]> {
    try {
      const vendors = await this.getAllVendors();
      return vendors.filter(vendor => vendor.riskLevel === riskLevel);
    } catch (error) {
      console.error(`Error fetching vendors with risk level ${riskLevel}:`, error);
      return [];
    }
  },
  
  /**
   * Get high risk vendors (convenience method)
   */
  async getHighRiskVendors(): Promise<Vendor[]> {
    try {
      const vendors = await this.getAllVendors();
      return vendors.filter(vendor => vendor.riskLevel === RiskLevel.HIGH);
    } catch (error) {
      console.error('Error fetching high risk vendors:', error);
      return [];
    }
  },
  
  /**
   * Calculate average risk score across all vendors
   */
  async getAverageRiskScore(): Promise<number> {
    try {
      const vendors = await this.getAllVendors();
      if (vendors.length === 0) return 0;
      
      const totalScore = vendors.reduce((sum, vendor) => sum + vendor.riskScore, 0);
      return totalScore / vendors.length;
    } catch (error) {
      console.error('Error calculating average risk score:', error);
      return 0;
    }
  },
  
  /**
   * Count vendors by status
   * Returns an object with counts for each status
   */
  async countVendorsByStatus(): Promise<Record<VendorStatus, number>> {
    try {
      const vendors = await this.getAllVendors();
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
    } catch (error) {
      console.error('Error counting vendors by status:', error);
      return {
        [VendorStatus.QUESTIONNAIRE_PENDING]: 0,
        [VendorStatus.IN_REVIEW]: 0,
        [VendorStatus.PENDING_REVIEW]: 0,
        [VendorStatus.APPROVED]: 0
      };
    }
  },
  
  /**
   * Get vendor statistics
   */
  async getVendorStats(): Promise<any> {
    try {
      const response = await apiClient.get<{ stats: any }>('/api/vendors/stats');
      return response.stats;
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      return null;
    }
  },
  
  /**
   * Create a new vendor
   */
  async createVendor(vendorData: Partial<Vendor>): Promise<Vendor | null> {
    try {
      const response = await apiClient.post<{ vendor: Vendor }>('/api/vendors', vendorData);
      return response.vendor;
    } catch (error) {
      console.error('Error creating vendor:', error);
      throw error;
    }
  },
  
  /**
   * Update a vendor
   */
  async updateVendor(id: string, vendorData: Partial<Vendor>): Promise<Vendor | null> {
    try {
      const response = await apiClient.put<{ vendor: Vendor }>(`/api/vendors/${id}`, vendorData);
      return response.vendor;
    } catch (error) {
      console.error(`Error updating vendor ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Delete a vendor
   */
  async deleteVendor(id: string): Promise<boolean> {
    try {
      await apiClient.delete<{ message: string }>(`/api/vendors/${id}`);
      return true;
    } catch (error) {
      console.error(`Error deleting vendor ${id}:`, error);
      throw error;
    }
  },
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaire(
    vendorId: string, 
    answers: Array<{ questionId: string; question: string; answer: string }>
  ): Promise<Vendor | null> {
    try {
      const response = await apiClient.post<{ vendor: Vendor }>(`/api/vendors/${vendorId}/answers`, { answers });
      return response.vendor;
    } catch (error) {
      console.error(`Error saving questionnaire for vendor ${vendorId}:`, error);
      throw error;
    }
  },
  
  /**
   * Create a new vendor with questionnaire answers
   */
  async createVendorWithQuestionnaire(
    vendorName: string,
    answers: Array<{ questionId: string; question: string; answer: string }>,
    vendorData: Partial<Omit<Vendor, 'id' | 'name'>> = {}
  ): Promise<Vendor | null> {
    try {
      const data = {
        name: vendorName,
        ...vendorData,
        answers
      };
      
      const response = await apiClient.post<{ vendor: Vendor }>('/api/vendors/with-answers', data);
      return response.vendor;
    } catch (error) {
      console.error('Error creating vendor with questionnaire:', error);
      throw error;
    }
  }
}; 