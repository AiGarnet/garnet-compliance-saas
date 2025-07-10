import { Injectable, NotFoundException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { CreateVendorDto, UpdateVendorDto, VendorQuestionnaireAnswerDto, CreateVendorWithAnswersDto, CreateVendorWorkDto, UpdateVendorWorkDto, ShareToTrustPortalDto } from './dto/vendor.dto';
import { Vendor, VendorStatus, QuestionnaireAnswer, VendorWork, WorkStatus, CreateVendorRequest, UpdateVendorRequest } from './entities/vendor.entity';

@Injectable()
export class VendorsService {
  constructor(
    private readonly databaseService: DatabaseService
  ) {}

  // SECURITY: This method should not be used to prevent data leakage across organizations
  async findAll(): Promise<Vendor[]> {
    throw new Error('SECURITY_VIOLATION: Use findAllByOrganization() instead to ensure proper vendor isolation');
  }

  // NEW: Organization-filtered vendor retrieval
  async findAllByOrganization(organizationId: string): Promise<Vendor[]> {
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
        v.organization_id as "organizationId",
        v.created_by_user_id as "createdByUserId",
        v.created_at as "createdAt",
        v.updated_at as "updatedAt",
        o.name as "organizationName",
        u.email as "createdByEmail",
        u.full_name as "createdByName"
      FROM vendors v
      LEFT JOIN organizations o ON v.organization_id = o.id
      LEFT JOIN users u ON v.created_by_user_id = u.id
      WHERE v.organization_id = $1
      ORDER BY v.created_at DESC
    `;

    const result = await this.databaseService.query(query, [organizationId]);
    return result.rows.map(row => ({
      ...row,
      id: row.vendorId.toString(), // Legacy compatibility
      name: row.companyName // Legacy compatibility
    }));
  }

  async findByUuid(uuid: string, organizationId?: string): Promise<Vendor | null> {
    let query = `
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
        v.organization_id as "organizationId",
        v.created_by_user_id as "createdByUserId",
        v.created_at as "createdAt",
        v.updated_at as "updatedAt",
        o.name as "organizationName",
        u.email as "createdByEmail",
        u.full_name as "createdByName"
      FROM vendors v
      LEFT JOIN organizations o ON v.organization_id = o.id
      LEFT JOIN users u ON v.created_by_user_id = u.id
      WHERE v.uuid = $1
    `;
    
    const params = [uuid];
    
    // Add organization filter if provided (for security)
    if (organizationId) {
      query += ` AND v.organization_id = $2`;
      params.push(organizationId);
    }

    const result = await this.databaseService.query(query, params);
    
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

  async findById(vendorId: number, organizationId?: string): Promise<Vendor | null> {
    let query = `
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
        v.organization_id as "organizationId",
        v.created_by_user_id as "createdByUserId",
        v.created_at as "createdAt",
        v.updated_at as "updatedAt",
        o.name as "organizationName",
        u.email as "createdByEmail",
        u.full_name as "createdByName"
      FROM vendors v
      LEFT JOIN organizations o ON v.organization_id = o.id
      LEFT JOIN users u ON v.created_by_user_id = u.id
      WHERE v.vendor_id = $1
    `;
    
    const params: any[] = [vendorId];
    
    // Add organization filter if provided (for security)
    if (organizationId) {
      query += ` AND v.organization_id = $2`;
      params.push(organizationId);
    }

    const result = await this.databaseService.query(query, params);
    
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
    // Generate proper UUID for the vendor using PostgreSQL's built-in function
    // Instead of custom string format, let PostgreSQL generate a proper UUID
    
    // Set default values
    const {
      companyName,
      region,
      contactEmail,
      status = VendorStatus.QUESTIONNAIRE_PENDING,
      contactName,
      website,
      industry,
      description,
      organizationId,
      createdByUserId
    } = createVendorRequest;

    const query = `
      INSERT INTO vendors (
        uuid, company_name, region, status,
        contact_name, contact_email, website, industry, description,
        organization_id, created_by_user_id,
        created_at, updated_at
      ) VALUES (
        gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()
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
        organization_id as "organizationId",
        created_by_user_id as "createdByUserId",
        created_at as "createdAt",
        updated_at as "updatedAt"
    `;

    const values = [
      companyName, region, status,
      contactName, contactEmail, website, industry, description,
      organizationId, createdByUserId
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

  async generateInviteToken(vendorId: number): Promise<{ token: string; expiresAt: Date; inviteLink: string }> {
    // Verify vendor exists
    const vendor = await this.findById(vendorId);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${vendorId} not found`);
    }

    // Generate UUID token
    const token = `${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days from now

    try {
      // First, delete any existing token for this vendor (only one active token per vendor)
      await this.databaseService.query(
        'DELETE FROM vendor_invite_tokens WHERE vendor_id = $1',
        [vendorId]
      );

      // Insert new token
      const insertQuery = `
        INSERT INTO vendor_invite_tokens (token, vendor_id, expires_at, used, created_at)
        VALUES ($1, $2, $3, false, NOW())
        RETURNING token, expires_at
      `;

      const result = await this.databaseService.query(insertQuery, [
        token,
        vendorId,
        expiresAt
      ]);

      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trust-portal/invite?token=${token}`;

      return {
        token: result.rows[0].token,
        expiresAt: result.rows[0].expires_at,
        inviteLink
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to generate invite token: ${error.message}`);
    }
  }

  async markInviteTokenAsUsed(token: string): Promise<void> {
    try {
      await this.databaseService.query(
        'UPDATE vendor_invite_tokens SET used = true WHERE token = $1',
        [token]
      );
    } catch (error) {
      throw new InternalServerErrorException(`Failed to mark invite token as used: ${error.message}`);
    }
  }

  async getActiveInviteToken(vendorId: number): Promise<{ token: string; expiresAt: Date; inviteLink: string } | null> {
    try {
      const query = `
        SELECT token, expires_at
        FROM vendor_invite_tokens
        WHERE vendor_id = $1 
          AND expires_at > NOW()
          AND used = false
        ORDER BY created_at DESC
        LIMIT 1
      `;

      const result = await this.databaseService.query(query, [vendorId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      const inviteLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/trust-portal/invite?token=${row.token}`;

      return {
        token: row.token,
        expiresAt: row.expires_at,
        inviteLink
      };
    } catch (error) {
      throw new InternalServerErrorException(`Failed to get active invite token: ${error.message}`);
    }
  }
} 