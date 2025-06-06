import { Vendor, QuestionnaireAnswer, VendorStatus, RiskLevel } from '../types/vendor';
import { VendorRepository } from '../db/vendorRepository';

export class VendorService {
  private vendorRepository: VendorRepository;
  
  constructor() {
    this.vendorRepository = new VendorRepository();
  }
  
  /**
   * Get all vendors
   */
  async getAllVendors(): Promise<Vendor[]> {
    return this.vendorRepository.getAllVendors();
  }
  
  /**
   * Get a vendor by ID
   */
  async getVendorById(id: string): Promise<Vendor | null> {
    return this.vendorRepository.getVendorById(id);
  }
  
  /**
   * Get vendors filtered by status
   */
  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    return this.vendorRepository.getVendorsByStatus(status);
  }
  
  /**
   * Get high risk vendors (convenience method)
   */
  async getHighRiskVendors(): Promise<Vendor[]> {
    const vendors = await this.vendorRepository.getAllVendors();
    return vendors.filter(vendor => vendor.riskLevel === RiskLevel.HIGH);
  }
  
  /**
   * Calculate average risk score across all vendors
   */
  async getAverageRiskScore(): Promise<number> {
    const vendors = await this.vendorRepository.getAllVendors();
    if (vendors.length === 0) return 0;
    
    const totalScore = vendors.reduce((sum, vendor) => sum + vendor.riskScore, 0);
    return totalScore / vendors.length;
  }
  
  /**
   * Count vendors by status
   */
  async countVendorsByStatus(): Promise<Record<VendorStatus, number>> {
    const vendors = await this.vendorRepository.getAllVendors();
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
  
  /**
   * Create a new vendor
   */
  async createVendor(vendorData: {
    name: string;
    status?: VendorStatus;
    riskScore?: number;
    riskLevel?: RiskLevel;
    contactName?: string;
    contactEmail?: string;
    website?: string;
    industry?: string;
    description?: string;
  }): Promise<Vendor> {
    // Set default values if not provided
    const vendorToCreate = {
      name: vendorData.name,
      status: vendorData.status || VendorStatus.QUESTIONNAIRE_PENDING,
      riskScore: vendorData.riskScore !== undefined ? vendorData.riskScore : 50, // Default risk score
      riskLevel: vendorData.riskLevel || this.calculateRiskLevel(vendorData.riskScore || 50),
      contactName: vendorData.contactName,
      contactEmail: vendorData.contactEmail,
      website: vendorData.website,
      industry: vendorData.industry,
      description: vendorData.description
    };
    
    return this.vendorRepository.createVendor(vendorToCreate);
  }
  
  /**
   * Update a vendor
   */
  async updateVendor(id: string, vendorData: Partial<Vendor>): Promise<Vendor | null> {
    // If risk score is updated, also update risk level
    if (vendorData.riskScore !== undefined && vendorData.riskLevel === undefined) {
      vendorData.riskLevel = this.calculateRiskLevel(vendorData.riskScore);
    }
    
    return this.vendorRepository.updateVendor(id, vendorData);
  }
  
  /**
   * Delete a vendor
   */
  async deleteVendor(id: string): Promise<boolean> {
    return this.vendorRepository.deleteVendor(id);
  }
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(
    vendorId: string,
    answers: { questionId: string; question: string; answer: string }[]
  ): Promise<QuestionnaireAnswer[]> {
    // Check if vendor exists
    const vendor = await this.vendorRepository.getVendorById(vendorId);
    if (!vendor) {
      throw new Error(`Vendor with ID ${vendorId} not found`);
    }
    
    // Add vendorId to each answer
    const answersWithVendorId = answers.map(answer => ({
      ...answer,
      vendorId
    }));
    
    return this.vendorRepository.saveVendorQuestionnaireAnswers(vendorId, answersWithVendorId);
  }
  
  /**
   * Create a new vendor with questionnaire answers
   */
  async createVendorWithAnswers(
    vendorData: {
      name: string;
      contactName?: string;
      contactEmail?: string;
      website?: string;
      industry?: string;
      description?: string;
    },
    answers: { questionId: string; question: string; answer: string }[]
  ): Promise<Vendor> {
    // Begin transaction
    try {
      // Create vendor with status set to IN_REVIEW
      const vendor = await this.createVendor({
        ...vendorData,
        status: VendorStatus.IN_REVIEW,
      });
      
      // Save answers
      if (answers.length > 0) {
        // Add vendorId to each answer
        const answersWithVendorId = answers.map(answer => ({
          ...answer,
          vendorId: vendor.id
        }));
        
        await this.vendorRepository.saveVendorQuestionnaireAnswers(vendor.id, answersWithVendorId);
      }
      
      // Return the vendor with answers
      return this.vendorRepository.getVendorById(vendor.id) as Promise<Vendor>;
    } catch (error) {
      throw error;
    }
  }
  
  /**
   * Calculate risk level based on risk score
   */
  private calculateRiskLevel(riskScore: number): RiskLevel {
    if (riskScore >= 66) {
      return RiskLevel.HIGH;
    } else if (riskScore >= 33) {
      return RiskLevel.MEDIUM;
    } else {
      return RiskLevel.LOW;
    }
  }
} 