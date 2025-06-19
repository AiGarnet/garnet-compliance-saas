import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto, CreateVendorWorkDto, UpdateVendorWorkDto, ShareToTrustPortalDto } from './dto/vendor.dto';
import { Vendor, VendorStatus, QuestionnaireAnswer, VendorWork, WorkStatus, CreateVendorRequest, UpdateVendorRequest } from './entities/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  async findAll(): Promise<Vendor[]> {
    const query = `
      SELECT 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        region,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendors 
      ORDER BY created_at DESC
    `;

    const result = await this.databaseService.query(query);
    return result.rows.map(row => ({
      ...row,
      id: row.vendorId.toString(), // Legacy compatibility
      name: row.companyName // Legacy compatibility
    }));
  }

  async findByUuid(uuid: string): Promise<Vendor | null> {
    const query = `
      SELECT 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        region,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendors 
      WHERE uuid = $1
    `;

    const result = await this.databaseService.query(query, [uuid]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const vendor = result.rows[0];
    return {
      ...vendor,
      id: vendor.vendorId.toString(), // Legacy compatibility
      name: vendor.companyName // Legacy compatibility
    };
  }

  async findById(vendorId: number): Promise<Vendor | null> {
    const query = `
      SELECT 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        region,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
      FROM vendors 
      WHERE vendor_id = $1
    `;

    const result = await this.databaseService.query(query, [vendorId]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const vendor = result.rows[0];
    return {
      ...vendor,
      id: vendor.vendorId.toString(), // Legacy compatibility
      name: vendor.companyName // Legacy compatibility
    };
  }

  async create(createVendorRequest: CreateVendorRequest): Promise<Vendor> {
    // Generate UUID for the vendor
    const uuid = `vendor_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Set default values
    const {
      companyName,
      region,
      contactEmail,
      status = VendorStatus.QUESTIONNAIRE_PENDING,
      contactName,
      website,
      industry,
      description
    } = createVendorRequest;

    const query = `
      INSERT INTO vendors (
        uuid, company_name, region, status,
        contact_name, contact_email, website, industry, description,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
      ) RETURNING 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        region,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      uuid, companyName, region, status,
      contactName, contactEmail, website, industry, description
    ];

    const result = await this.databaseService.query(query, values);
    const vendor = result.rows[0];
    
    return {
      ...vendor,
      id: vendor.vendorId.toString(), // Legacy compatibility
      name: vendor.companyName // Legacy compatibility
    };
  }

  async update(vendorId: number, updateData: Partial<UpdateVendorRequest>): Promise<Vendor> {
    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCounter = 1;

    // Define allowed update fields
    const allowedFields = {
      companyName: 'company_name',
      contactName: 'contact_name', 
      contactEmail: 'contact_email',
      website: 'website',
      industry: 'industry',
      description: 'description',
      region: 'region',
      status: 'status'
    };

    // Build update fields dynamically
    Object.entries(updateData).forEach(([key, value]) => {
      if (key in allowedFields && value !== undefined) {
        updateFields.push(`${allowedFields[key]} = $${paramCounter}`);
        values.push(value);
        paramCounter++;
      }
    });

    if (updateFields.length === 0) {
      throw new BadRequestException('No valid fields provided for update');
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add vendor_id for WHERE clause
    values.push(vendorId);

    const query = `
      UPDATE vendors 
      SET ${updateFields.join(', ')}
      WHERE vendor_id = $${paramCounter}
      RETURNING 
        vendor_id as "vendorId",
        uuid,
        company_name as "companyName",
        contact_name as "contactName",
        contact_email as "contactEmail",
        website,
        industry,
        description,
        region,
        status,
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const result = await this.databaseService.query(query, values);
    
    if (result.rows.length === 0) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    const vendor = result.rows[0];
    return {
      ...vendor,
      id: vendor.vendorId.toString(), // Legacy compatibility
      name: vendor.companyName // Legacy compatibility
    };
  }

  async delete(vendorId: number): Promise<boolean> {
    const query = 'DELETE FROM vendors WHERE vendor_id = $1';
    const result = await this.databaseService.query(query, [vendorId]);
    return result.rowCount > 0;
  }

  async getVendorByInviteToken(token: string): Promise<Vendor | null> {
    const query = `
      SELECT 
        v.vendor_id as "vendorId",
        v.uuid,
        v.company_name as "companyName",
        v.contact_name as "contactName",
        v.contact_email as "contactEmail",
        v.website,
        v.industry,
        v.description,
        v.region,
        v.status,
        v.created_at as "createdAt",
        v.updated_at as "updatedAt"
      FROM vendors v
      INNER JOIN vendor_invite_tokens vit ON v.vendor_id = vit.vendor_id
      WHERE vit.token = $1 
        AND vit.expires_at > NOW()
        AND vit.used = false
    `;

    const result = await this.databaseService.query(query, [token]);
    
    if (result.rows.length === 0) {
      return null;
    }

    const vendor = result.rows[0];
    return {
      ...vendor,
      id: vendor.vendorId.toString(), // Legacy compatibility
      name: vendor.companyName // Legacy compatibility
    };
  }

  async getTrustPortalData(vendorId: string): Promise<any> {
    try {
      // Get vendor basic info
      const vendor = await this.findById(parseInt(vendorId));
      
      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
      }

      // Get trust portal items for this vendor
      const trustPortalQuery = `
        SELECT 
          item_id as "itemId",
          vendor_id as "vendorId",
          title,
          description,
          category,
          content,
          order_index as "orderIndex",
          is_active as "isActive",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM trust_portal_items
        WHERE vendor_id = $1 AND is_active = true
        ORDER BY order_index ASC, created_at DESC
      `;

      const trustPortalResult = await this.databaseService.query(trustPortalQuery, [vendorId]);

      // Get vendor works that are shared to trust portal
      const worksQuery = `
        SELECT 
          work_id as "workId",
          vendor_id as "vendorId",
          project_name as "projectName",
          description,
          status,
          start_date as "startDate",
          end_date as "endDate",
          client_name as "clientName",
          technologies,
          category,
          share_to_trust_portal as "shareToTrustPortal",
          evidence_files as "evidenceFiles",
          questionnaire_answers as "questionnaireAnswers",
          is_draft as "isDraft",
          created_at as "createdAt",
          updated_at as "updatedAt"
        FROM vendor_works
        WHERE vendor_id = $1 AND share_to_trust_portal = true AND is_draft = false
        ORDER BY created_at DESC
      `;

      const worksResult = await this.databaseService.query(worksQuery, [vendorId]);

      return {
        vendor: vendor,
        trustPortalItems: trustPortalResult.rows,
        vendorWorks: worksResult.rows
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get trust portal data: ${error.message}`);
    }
  }

  // ... existing code ...
} 