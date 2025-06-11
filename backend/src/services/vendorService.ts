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
    // Check if the ID is a valid number (numeric vendor ID)
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId.toString() === id) {
      // It's a numeric ID
      return this.vendorRepository.getVendorById(numericId);
    } else {
      // It's a UUID
      return this.vendorRepository.getVendorByUuid(id);
    }
  }
  
  /**
   * Get vendors filtered by status
   */
  async getVendorsByStatus(status: VendorStatus): Promise<Vendor[]> {
    return this.vendorRepository.getVendorsByStatus(status);
  }

  /**
   * Get vendors with AI suggestions
   */
  async getVendorsWithSuggestions(): Promise<Vendor[]> {
    return this.vendorRepository.getVendorsWithSuggestions();
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
      companyName: vendorData.name, // Map name to companyName
      region: 'US', // Default region - you might want to make this configurable
      contactEmail: vendorData.contactEmail || 'unknown@example.com', // Default email if not provided
      status: vendorData.status || VendorStatus.QUESTIONNAIRE_PENDING,
      riskScore: vendorData.riskScore !== undefined ? vendorData.riskScore : 50, // Default risk score
      riskLevel: vendorData.riskLevel || this.calculateRiskLevel(vendorData.riskScore || 50),
      contactName: vendorData.contactName,
      website: vendorData.website,
      industry: vendorData.industry,
      description: vendorData.description
    };

    return this.vendorRepository.createVendor(vendorToCreate);
  }
  
  /**
   * Update a vendor
   */
  async updateVendor(id: string, vendorData: Partial<{
    name?: string;
    status?: VendorStatus;
    riskScore?: number;
    riskLevel?: RiskLevel;
    contactName?: string;
    contactEmail?: string;
    website?: string;
    industry?: string;
    description?: string;
  }>): Promise<Vendor | null> {
    // If risk score is updated, also update risk level
    if (vendorData.riskScore !== undefined && vendorData.riskLevel === undefined) {
      vendorData.riskLevel = this.calculateRiskLevel(vendorData.riskScore);
    }

    // Map the fields to match the database schema
    const updateData: any = {};
    
    if (vendorData.name !== undefined) {
      updateData.companyName = vendorData.name; // Map name to companyName
    }
    if (vendorData.status !== undefined) {
      updateData.status = vendorData.status;
    }
    if (vendorData.riskScore !== undefined) {
      updateData.riskScore = vendorData.riskScore;
    }
    if (vendorData.riskLevel !== undefined) {
      updateData.riskLevel = vendorData.riskLevel;
    }
    if (vendorData.contactName !== undefined) {
      updateData.contactName = vendorData.contactName;
    }
    if (vendorData.contactEmail !== undefined) {
      updateData.contactEmail = vendorData.contactEmail;
    }
    if (vendorData.website !== undefined) {
      updateData.website = vendorData.website;
    }
    if (vendorData.industry !== undefined) {
      updateData.industry = vendorData.industry;
    }
    if (vendorData.description !== undefined) {
      updateData.description = vendorData.description;
    }

    // Check if the ID is a valid number (numeric vendor ID)
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId.toString() === id) {
      // It's a numeric ID
      return this.vendorRepository.updateVendor(numericId, updateData);
    } else {
      // For UUIDs, we need to first get the vendor to get the numeric ID
      const vendor = await this.vendorRepository.getVendorByUuid(id);
      if (!vendor) {
        return null;
      }
      return this.vendorRepository.updateVendor(vendor.vendorId, updateData);
    }
  }
  
  /**
   * Delete a vendor
   */
  async deleteVendor(id: string): Promise<boolean> {
    // Check if the ID is a valid number (numeric vendor ID)
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId) && numericId.toString() === id) {
      // It's a numeric ID
      return this.vendorRepository.deleteVendor(numericId);
    } else {
      // For UUIDs, we need to first get the vendor to get the numeric ID
      const vendor = await this.vendorRepository.getVendorByUuid(id);
      if (!vendor) {
        return false;
      }
      return this.vendorRepository.deleteVendor(vendor.vendorId);
    }
  }
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(
    vendorId: string,
    answers: { questionId: string; question: string; answer: string }[]
  ): Promise<QuestionnaireAnswer[]> {
    // Check if vendor exists and get numeric ID
    const vendor = await this.getVendorById(vendorId);
    if (!vendor) {
      throw new Error(`Vendor with ID ${vendorId} not found`);
    }

    // Add vendorId to each answer
    const answersWithVendorId = answers.map(answer => ({
      ...answer,
      vendorId: vendor.vendorId // Use the numeric vendor ID
    }));

    return this.vendorRepository.saveVendorQuestionnaireAnswers(vendor.vendorId, answersWithVendorId);
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
        // Add vendorId to each answer using the numeric vendor ID
        const answersWithVendorId = answers.map(answer => ({
          ...answer,
          vendorId: vendor.vendorId // Use the numeric vendorId from the created vendor
        }));
        
        await this.vendorRepository.saveVendorQuestionnaireAnswers(vendor.vendorId, answersWithVendorId);
      }
      
      // Return the vendor with answers
      return this.getVendorById(vendor.vendorId.toString()) as Promise<Vendor>;
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