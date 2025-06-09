import { Request, Response } from 'express';
import { VendorService } from '../services/vendorService';
import { VendorStatus, RiskLevel } from '../types/vendor';

const vendorService = new VendorService();

/**
 * Controller for vendor-related API endpoints
 */
export class VendorController {
  /**
   * Get all vendors
   */
  async getAllVendors(req: Request, res: Response) {
    try {
      console.log('VendorController: getAllVendors called');
      const vendors = await vendorService.getAllVendors();
      console.log(`VendorController: Found ${vendors.length} vendors`);
      res.json({ vendors });
    } catch (error: any) {
      console.error('Error fetching vendors:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Get a vendor by ID
   */
  async getVendorById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const vendor = await vendorService.getVendorById(id);
      
      if (!vendor) {
        return res.status(404).json({ error: `Vendor with ID ${id} not found` });
      }
      
      res.json({ vendor });
    } catch (error: any) {
      console.error(`Error fetching vendor with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Create a new vendor
   */
  async createVendor(req: Request, res: Response) {
    try {
      const {
        name,
        status,
        riskScore,
        riskLevel,
        contactName,
        contactEmail,
        website,
        industry,
        description
      } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Vendor name is required' });
      }
      
      // Validate status if provided
      if (status && !Object.values(VendorStatus).includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Object.values(VendorStatus).join(', ')}`
        });
      }
      
      // Validate risk level if provided
      if (riskLevel && !Object.values(RiskLevel).includes(riskLevel)) {
        return res.status(400).json({
          error: `Invalid risk level. Must be one of: ${Object.values(RiskLevel).join(', ')}`
        });
      }
      
      // Create vendor
      const vendor = await vendorService.createVendor({
        name,
        status,
        riskScore,
        riskLevel,
        contactName,
        contactEmail,
        website,
        industry,
        description
      });
      
      res.status(201).json({ vendor });
    } catch (error: any) {
      console.error('Error creating vendor:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Update a vendor
   */
  async updateVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const {
        name,
        status,
        riskScore,
        riskLevel,
        contactName,
        contactEmail,
        website,
        industry,
        description
      } = req.body;
      
      // Validate status if provided
      if (status && !Object.values(VendorStatus).includes(status)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Object.values(VendorStatus).join(', ')}`
        });
      }
      
      // Validate risk level if provided
      if (riskLevel && !Object.values(RiskLevel).includes(riskLevel)) {
        return res.status(400).json({
          error: `Invalid risk level. Must be one of: ${Object.values(RiskLevel).join(', ')}`
        });
      }
      
      // Update vendor
      const vendor = await vendorService.updateVendor(id, {
        name,
        status,
        riskScore,
        riskLevel,
        contactName,
        contactEmail,
        website,
        industry,
        description
      });
      
      if (!vendor) {
        return res.status(404).json({ error: `Vendor with ID ${id} not found` });
      }
      
      res.json({ vendor });
    } catch (error: any) {
      console.error(`Error updating vendor with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Delete a vendor
   */
  async deleteVendor(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const deleted = await vendorService.deleteVendor(id);
      
      if (!deleted) {
        return res.status(404).json({ error: `Vendor with ID ${id} not found` });
      }
      
      res.json({ message: `Vendor with ID ${id} has been deleted` });
    } catch (error: any) {
      console.error(`Error deleting vendor with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Get vendors by status
   */
  async getVendorsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;
      
      // Validate status
      if (!Object.values(VendorStatus).includes(status as VendorStatus)) {
        return res.status(400).json({
          error: `Invalid status. Must be one of: ${Object.values(VendorStatus).join(', ')}`
        });
      }
      
      const vendors = await vendorService.getVendorsByStatus(status as VendorStatus);
      res.json({ vendors });
    } catch (error: any) {
      console.error(`Error fetching vendors with status ${req.params.status}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Save questionnaire answers for a vendor
   */
  async saveVendorQuestionnaireAnswers(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { answers } = req.body;
      
      // Validate answers
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: 'Answers array is required and cannot be empty' });
      }
      
      for (const answer of answers) {
        if (!answer.questionId || !answer.question || answer.answer === undefined) {
          return res.status(400).json({
            error: 'Each answer must have questionId, question, and answer fields'
          });
        }
      }
      
      const savedAnswers = await vendorService.saveVendorQuestionnaireAnswers(id, answers);
      
      // Get updated vendor
      const vendor = await vendorService.getVendorById(id);
      
      res.json({ vendor, answers: savedAnswers });
    } catch (error: any) {
      console.error(`Error saving questionnaire answers for vendor with ID ${req.params.id}:`, error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Create a new vendor with questionnaire answers
   */
  async createVendorWithAnswers(req: Request, res: Response) {
    try {
      const {
        name,
        contactName,
        contactEmail,
        website,
        industry,
        description,
        answers
      } = req.body;
      
      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Vendor name is required' });
      }
      
      // Validate answers if provided
      if (answers) {
        if (!Array.isArray(answers)) {
          return res.status(400).json({ error: 'Answers must be an array' });
        }
        
        for (const answer of answers) {
          if (!answer.questionId || !answer.question || answer.answer === undefined) {
            return res.status(400).json({
              error: 'Each answer must have questionId, question, and answer fields'
            });
          }
        }
      }
      
      // Create vendor with answers
      const vendor = await vendorService.createVendorWithAnswers(
        {
          name,
          contactName,
          contactEmail,
          website,
          industry,
          description
        },
        answers || []
      );
      
      res.status(201).json({ vendor });
    } catch (error: any) {
      console.error('Error creating vendor with answers:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
  
  /**
   * Get vendor statistics
   */
  async getVendorStats(req: Request, res: Response) {
    try {
      const [vendors, statusCounts, averageRiskScore, highRiskVendors] = await Promise.all([
        vendorService.getAllVendors(),
        vendorService.countVendorsByStatus(),
        vendorService.getAverageRiskScore(),
        vendorService.getHighRiskVendors()
      ]);
      
      const stats = {
        totalVendors: vendors.length,
        statusCounts,
        averageRiskScore,
        highRiskVendorsCount: highRiskVendors.length
      };
      
      res.json({ stats });
    } catch (error: any) {
      console.error('Error getting vendor statistics:', error);
      res.status(500).json({ error: error.message || 'Internal server error' });
    }
  }
} 