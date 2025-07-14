import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { OrganizationsService } from '../organizations/organizations.service';

export interface AdminFilters {
  page?: number;
  limit?: number;
  role?: string;
  organization?: string;
  active?: boolean;
  status?: string;
  userId?: string;
  type?: string;
}

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  // ============ DASHBOARD OVERVIEW ============
  async getDashboardOverview() {
    try {
      // Get counts for all major entities
      const userCountQuery = 'SELECT COUNT(*) as count FROM users WHERE is_active = true';
      const vendorCountQuery = 'SELECT COUNT(*) as count FROM vendors';
      const orgCountQuery = 'SELECT COUNT(*) as count FROM organizations WHERE is_active = true';
      const waitlistCountQuery = 'SELECT COUNT(*) as count FROM waitlist';
      const activityCountQuery = 'SELECT COUNT(*) as count FROM activities WHERE created_at >= NOW() - INTERVAL \'24 hours\'';

      const [userCount, vendorCount, orgCount, waitlistCount, activityCount] = await Promise.all([
        this.databaseService.query(userCountQuery),
        this.databaseService.query(vendorCountQuery),
        this.databaseService.query(orgCountQuery),
        this.databaseService.query(waitlistCountQuery),
        this.databaseService.query(activityCountQuery),
      ]);

      // Get recent activities
      const recentActivitiesQuery = `
        SELECT a.*, u.full_name as user_name 
        FROM activities a 
        LEFT JOIN users u ON a.user_id = u.id 
        ORDER BY a.created_at DESC 
        LIMIT 10
      `;
      const recentActivities = await this.databaseService.query(recentActivitiesQuery);

      // Get user distribution by role
      const userRoleDistQuery = `
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE is_active = true 
        GROUP BY role
      `;
      const userRoleDistribution = await this.databaseService.query(userRoleDistQuery);

      // Get vendor status distribution
      const vendorStatusDistQuery = `
        SELECT status, COUNT(*) as count 
        FROM vendors 
        GROUP BY status
      `;
      const vendorStatusDistribution = await this.databaseService.query(vendorStatusDistQuery);

      return {
        overview: {
          totalUsers: parseInt(userCount.rows[0].count),
          totalVendors: parseInt(vendorCount.rows[0].count),
          totalOrganizations: parseInt(orgCount.rows[0].count),
          waitlistSubscribers: parseInt(waitlistCount.rows[0].count),
          recentActivities: parseInt(activityCount.rows[0].count),
        },
        recentActivities: recentActivities.rows,
        userRoleDistribution: userRoleDistribution.rows,
        vendorStatusDistribution: vendorStatusDistribution.rows,
      };
    } catch (error) {
      this.logger.error('Error getting dashboard overview:', error);
      throw new BadRequestException('Failed to get dashboard overview');
    }
  }

  // ============ USER MANAGEMENT ============
  async getAllUsers(filters: AdminFilters) {
    try {
      const { page = 1, limit = 20, role, organization, active } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (role) {
        whereConditions.push(`u.role = $${paramIndex++}`);
        queryParams.push(role);
      }

      if (organization) {
        whereConditions.push(`(o.name ILIKE $${paramIndex++} OR u.organization ILIKE $${paramIndex++})`);
        queryParams.push(`%${organization}%`, `%${organization}%`);
      }

      if (active !== undefined) {
        whereConditions.push(`u.is_active = $${paramIndex++}`);
        queryParams.push(active);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT u.*, o.name as organization_name, o.domain as organization_domain
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        ${whereClause}
        ORDER BY u.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        ${whereClause}
      `;

      const [users, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, queryParams.slice(0, -2)), // Remove limit and offset for count
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        users: users.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error getting all users:', error);
      throw new BadRequestException('Failed to get users');
    }
  }

  async getUserById(id: string) {
    try {
      const query = `
        SELECT u.*, o.name as organization_name, o.domain as organization_domain
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        WHERE u.id = $1
      `;
      const result = await this.databaseService.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      // Get user activities
      const activitiesQuery = `
        SELECT * FROM activities 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT 20
      `;
      const activities = await this.databaseService.query(activitiesQuery, [id]);

      return {
        user: result.rows[0],
        recentActivities: activities.rows,
      };
    } catch (error) {
      this.logger.error('Error getting user by ID:', error);
      throw new BadRequestException('Failed to get user');
    }
  }

  async updateUser(id: string, updateData: any) {
    try {
      const allowedFields = ['full_name', 'role', 'organization', 'organization_id', 'is_active'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex++}`);
          updateValues.push(updateData[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const query = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.databaseService.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      return { user: result.rows[0] };
    } catch (error) {
      this.logger.error('Error updating user:', error);
      throw new BadRequestException('Failed to update user');
    }
  }

  async deactivateUser(id: string) {
    try {
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.databaseService.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      return { message: 'User deactivated successfully', user: result.rows[0] };
    } catch (error) {
      this.logger.error('Error deactivating user:', error);
      throw new BadRequestException('Failed to deactivate user');
    }
  }

  async activateUser(id: string) {
    try {
      const query = `
        UPDATE users 
        SET is_active = true, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await this.databaseService.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException('User not found');
      }

      return { message: 'User activated successfully', user: result.rows[0] };
    } catch (error) {
      this.logger.error('Error activating user:', error);
      throw new BadRequestException('Failed to activate user');
    }
  }

  // ============ VENDOR MANAGEMENT ============
  async getAllVendors(filters: AdminFilters) {
    try {
      const { page = 1, limit = 20, status, organization } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (status) {
        whereConditions.push(`v.status = $${paramIndex++}`);
        queryParams.push(status);
      }

      if (organization) {
        whereConditions.push(`o.name ILIKE $${paramIndex++}`);
        queryParams.push(`%${organization}%`);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT v.*, o.name as organization_name, u.full_name as created_by_name
        FROM vendors v
        LEFT JOIN organizations o ON v.organization_id = o.id
        LEFT JOIN users u ON v.created_by_user_id = u.id
        ${whereClause}
        ORDER BY v.created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM vendors v
        LEFT JOIN organizations o ON v.organization_id = o.id
        ${whereClause}
      `;

      const [vendors, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        vendors: vendors.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error getting all vendors:', error);
      throw new BadRequestException('Failed to get vendors');
    }
  }

  async getVendorById(id: string) {
    try {
      const query = `
        SELECT v.*, o.name as organization_name, u.full_name as created_by_name
        FROM vendors v
        LEFT JOIN organizations o ON v.organization_id = o.id
        LEFT JOIN users u ON v.created_by_user_id = u.id
        WHERE v.vendor_id = $1 OR v.uuid = $1
      `;
      const result = await this.databaseService.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException('Vendor not found');
      }

      // Get vendor works
      const worksQuery = 'SELECT * FROM vendor_works WHERE vendor_id = $1';
      const works = await this.databaseService.query(worksQuery, [result.rows[0].vendor_id]);

      // Get questionnaire answers
      const answersQuery = 'SELECT * FROM vendor_questionnaire_answers WHERE vendor_id = $1';
      const answers = await this.databaseService.query(answersQuery, [result.rows[0].vendor_id]);

      return {
        vendor: result.rows[0],
        works: works.rows,
        questionnaireAnswers: answers.rows,
      };
    } catch (error) {
      this.logger.error('Error getting vendor by ID:', error);
      throw new BadRequestException('Failed to get vendor');
    }
  }

  async updateVendor(id: string, updateData: any) {
    try {
      const allowedFields = ['company_name', 'region', 'status', 'contact_name', 'contact_email', 'website', 'industry', 'description', 'risk_score', 'risk_level'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex++}`);
          updateValues.push(updateData[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const query = `
        UPDATE vendors 
        SET ${updateFields.join(', ')}
        WHERE vendor_id = $${paramIndex} OR uuid = $${paramIndex}
        RETURNING *
      `;

      const result = await this.databaseService.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new NotFoundException('Vendor not found');
      }

      return { vendor: result.rows[0] };
    } catch (error) {
      this.logger.error('Error updating vendor:', error);
      throw new BadRequestException('Failed to update vendor');
    }
  }

  async deleteVendor(id: string) {
    try {
      const query = `
        DELETE FROM vendors 
        WHERE vendor_id = $1 OR uuid = $1
        RETURNING *
      `;
      const result = await this.databaseService.query(query, [id]);

      if (result.rows.length === 0) {
        throw new NotFoundException('Vendor not found');
      }

      return { message: 'Vendor deleted successfully', vendor: result.rows[0] };
    } catch (error) {
      this.logger.error('Error deleting vendor:', error);
      throw new BadRequestException('Failed to delete vendor');
    }
  }

  // ============ ORGANIZATION MANAGEMENT ============
  async getAllOrganizations() {
    try {
      const query = `
        SELECT o.*, COUNT(u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id AND u.is_active = true
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      const result = await this.databaseService.query(query);
      return { organizations: result.rows };
    } catch (error) {
      this.logger.error('Error getting all organizations:', error);
      throw new BadRequestException('Failed to get organizations');
    }
  }

  async getOrganizationById(id: string) {
    try {
      const orgQuery = `
        SELECT o.*, COUNT(u.id) as user_count
        FROM organizations o
        LEFT JOIN users u ON o.id = u.organization_id AND u.is_active = true
        WHERE o.id = $1
        GROUP BY o.id
      `;
      const orgResult = await this.databaseService.query(orgQuery, [id]);

      if (orgResult.rows.length === 0) {
        throw new NotFoundException('Organization not found');
      }

      // Get organization users
      const usersQuery = `
        SELECT id, email, full_name, role, is_active, created_at
        FROM users 
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `;
      const users = await this.databaseService.query(usersQuery, [id]);

      // Get organization vendors
      const vendorsQuery = `
        SELECT vendor_id, uuid, company_name, status, created_at
        FROM vendors 
        WHERE organization_id = $1
        ORDER BY created_at DESC
      `;
      const vendors = await this.databaseService.query(vendorsQuery, [id]);

      return {
        organization: orgResult.rows[0],
        users: users.rows,
        vendors: vendors.rows,
      };
    } catch (error) {
      this.logger.error('Error getting organization by ID:', error);
      throw new BadRequestException('Failed to get organization');
    }
  }

  async updateOrganization(id: string, updateData: any) {
    try {
      const allowedFields = ['name', 'domain', 'max_users', 'settings', 'is_active'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          if (field === 'settings') {
            updateFields.push(`${field} = $${paramIndex++}::jsonb`);
            updateValues.push(JSON.stringify(updateData[field]));
          } else {
            updateFields.push(`${field} = $${paramIndex++}`);
            updateValues.push(updateData[field]);
          }
        }
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const query = `
        UPDATE organizations 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.databaseService.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new NotFoundException('Organization not found');
      }

      return { organization: result.rows[0] };
    } catch (error) {
      this.logger.error('Error updating organization:', error);
      throw new BadRequestException('Failed to update organization');
    }
  }

  async createOrganization(organizationData: any) {
    try {
      return await this.organizationsService.createOrganization(organizationData);
    } catch (error) {
      this.logger.error('Error creating organization:', error);
      throw new BadRequestException('Failed to create organization');
    }
  }

  // ============ ANALYTICS & MONITORING ============
  async getUserAnalytics() {
    try {
      // User growth over time (last 30 days)
      const userGrowthQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM users
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // User distribution by role
      const roleDistQuery = `
        SELECT role, COUNT(*) as count, 
               COUNT(CASE WHEN is_active THEN 1 END) as active_count
        FROM users
        GROUP BY role
      `;

      // User distribution by organization
      const orgDistQuery = `
        SELECT o.name as organization, COUNT(u.id) as count
        FROM users u
        LEFT JOIN organizations o ON u.organization_id = o.id
        GROUP BY o.name
        ORDER BY count DESC
      `;

      const [userGrowth, roleDistribution, orgDistribution] = await Promise.all([
        this.databaseService.query(userGrowthQuery),
        this.databaseService.query(roleDistQuery),
        this.databaseService.query(orgDistQuery),
      ]);

      return {
        userGrowth: userGrowth.rows,
        roleDistribution: roleDistribution.rows,
        organizationDistribution: orgDistribution.rows,
      };
    } catch (error) {
      this.logger.error('Error getting user analytics:', error);
      throw new BadRequestException('Failed to get user analytics');
    }
  }

  async getVendorAnalytics() {
    try {
      // Vendor creation over time
      const vendorGrowthQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM vendors
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // Vendor status distribution
      const statusDistQuery = `
        SELECT status, COUNT(*) as count
        FROM vendors
        GROUP BY status
      `;

      // Vendor risk level distribution
      const riskDistQuery = `
        SELECT risk_level, COUNT(*) as count
        FROM vendors
        WHERE risk_level IS NOT NULL
        GROUP BY risk_level
      `;

      const [vendorGrowth, statusDistribution, riskDistribution] = await Promise.all([
        this.databaseService.query(vendorGrowthQuery),
        this.databaseService.query(statusDistQuery),
        this.databaseService.query(riskDistQuery),
      ]);

      return {
        vendorGrowth: vendorGrowth.rows,
        statusDistribution: statusDistribution.rows,
        riskDistribution: riskDistribution.rows,
      };
    } catch (error) {
      this.logger.error('Error getting vendor analytics:', error);
      throw new BadRequestException('Failed to get vendor analytics');
    }
  }

  async getActivityAnalytics(days: number = 30) {
    try {
      // First check if activities table exists and has data
      const tableCheckQuery = `
        SELECT COUNT(*) as total_count
        FROM activities
      `;

      const tableCheck = await this.databaseService.query(tableCheckQuery);
      const totalActivities = parseInt(tableCheck.rows[0].total_count);

      // If no activities, return empty analytics
      if (totalActivities === 0) {
        return {
          activityVolume: [],
          activityTypes: [],
          mostActiveUsers: [],
          totalActivities: 0,
          message: 'No activities found in the system'
        };
      }

      // Activity volume over time
      const activityVolumeQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM activities
        WHERE created_at >= NOW() - INTERVAL $1
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // Activity type distribution  
      const activityTypeQuery = `
        SELECT activity_type as type, COUNT(*) as count
        FROM activities
        WHERE created_at >= NOW() - INTERVAL $1
        GROUP BY activity_type
        ORDER BY count DESC
      `;

      // Most active users (using metadata for user info)
      const activeUsersQuery = `
        SELECT 
          COALESCE(metadata->>'userName', 'Unknown User') as user_name,
          COALESCE(metadata->>'userEmail', '') as user_email,
          COUNT(*) as activity_count
        FROM activities a
        WHERE a.created_at >= NOW() - INTERVAL $1
        GROUP BY metadata->>'userName', metadata->>'userEmail'
        ORDER BY activity_count DESC
        LIMIT 10
      `;

      const intervalValue = `${days} days`;

      const [activityVolume, activityTypes, activeUsers] = await Promise.all([
        this.databaseService.query(activityVolumeQuery, [intervalValue]),
        this.databaseService.query(activityTypeQuery, [intervalValue]),
        this.databaseService.query(activeUsersQuery, [intervalValue]),
      ]);

      return {
        activityVolume: activityVolume.rows || [],
        activityTypes: activityTypes.rows || [],
        mostActiveUsers: activeUsers.rows || [],
        totalActivities,
        daysAnalyzed: days
      };
    } catch (error) {
      this.logger.error('Error getting activity analytics:', error);
      // Return empty analytics instead of throwing error
      return {
        activityVolume: [],
        activityTypes: [],
        mostActiveUsers: [],
        totalActivities: 0,
        error: 'Failed to fetch activity analytics',
        details: error.message
      };
    }
  }

  async getWaitlistAnalytics() {
    try {
      // Waitlist growth over time
      const waitlistGrowthQuery = `
        SELECT DATE(created_at) as date, COUNT(*) as count
        FROM waitlist
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE(created_at)
        ORDER BY date
      `;

      // Waitlist role distribution
      const roleDistQuery = `
        SELECT role, COUNT(*) as count
        FROM waitlist
        GROUP BY role
      `;

      // Waitlist organization distribution (top 10)
      const orgDistQuery = `
        SELECT organization, COUNT(*) as count
        FROM waitlist
        WHERE organization IS NOT NULL
        GROUP BY organization
        ORDER BY count DESC
        LIMIT 10
      `;

      const [waitlistGrowth, roleDistribution, orgDistribution] = await Promise.all([
        this.databaseService.query(waitlistGrowthQuery),
        this.databaseService.query(roleDistQuery),
        this.databaseService.query(orgDistQuery),
      ]);

      // Total waitlist stats
      const totalQuery = 'SELECT COUNT(*) as total FROM waitlist';
      const total = await this.databaseService.query(totalQuery);

      return {
        total: parseInt(total.rows[0].total),
        waitlistGrowth: waitlistGrowth.rows,
        roleDistribution: roleDistribution.rows,
        organizationDistribution: orgDistribution.rows,
      };
    } catch (error) {
      this.logger.error('Error getting waitlist analytics:', error);
      throw new BadRequestException('Failed to get waitlist analytics');
    }
  }

  // ============ ACTIVITY MONITORING ============
  async getActivities(filters: AdminFilters) {
    try {
      const { page = 1, limit = 50, userId, type } = filters;
      const offset = (page - 1) * limit;

      let whereConditions = [];
      let queryParams = [];
      let paramIndex = 1;

      if (userId) {
        whereConditions.push(`user_id = $${paramIndex++}`);
        queryParams.push(userId);
      }

      if (type) {
        whereConditions.push(`type = $${paramIndex++}`);
        queryParams.push(type);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT *
        FROM activities
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex++} OFFSET $${paramIndex++}
      `;
      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM activities
        ${whereClause}
      `;

      const [activities, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, queryParams.slice(0, -2)),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        activities: activities.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error getting activities:', error);
      throw new BadRequestException('Failed to get activities');
    }
  }

  async getRecentActivities() {
    try {
      const query = `
        SELECT *
        FROM activities
        WHERE created_at >= NOW() - INTERVAL '24 hours'
        ORDER BY created_at DESC
        LIMIT 50
      `;
      const result = await this.databaseService.query(query);
      return { activities: result.rows };
    } catch (error) {
      this.logger.error('Error getting recent activities:', error);
      throw new BadRequestException('Failed to get recent activities');
    }
  }

  // ============ SYSTEM MANAGEMENT ============
  async getSystemHealth() {
    try {
      // Database connection check
      const dbHealthQuery = 'SELECT NOW() as current_time';
      const dbHealth = await this.databaseService.query(dbHealthQuery);

      // Table sizes
      const tableSizesQuery = `
        SELECT 
          schemaname,
          tablename,
          pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
          pg_total_relation_size(schemaname||'.'||tablename) as size_bytes
        FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY size_bytes DESC
      `;
      const tableSizes = await this.databaseService.query(tableSizesQuery);

      // Active connections
      const connectionsQuery = 'SELECT count(*) as active_connections FROM pg_stat_activity';
      const connections = await this.databaseService.query(connectionsQuery);

      return {
        database: {
          status: 'healthy',
          currentTime: dbHealth.rows[0].current_time,
          activeConnections: parseInt(connections.rows[0].active_connections),
        },
        tableSizes: tableSizes.rows,
      };
    } catch (error) {
      this.logger.error('Error getting system health:', error);
      return {
        database: {
          status: 'error',
          error: error.message,
        },
      };
    }
  }

  async getSystemStats() {
    try {
      const statsQueries = [
        'SELECT COUNT(*) as count FROM users',
        'SELECT COUNT(*) as count FROM vendors',
        'SELECT COUNT(*) as count FROM organizations',
        'SELECT COUNT(*) as count FROM waitlist',
        'SELECT COUNT(*) as count FROM activities',
        'SELECT COUNT(*) as count FROM questionnaires',
        'SELECT COUNT(*) as count FROM vendor_works',
        'SELECT COUNT(*) as count FROM evidence_files',
      ];

      const [users, vendors, organizations, waitlist, activities, questionnaires, vendorWorks, evidenceFiles] = await Promise.all(
        statsQueries.map(query => this.databaseService.query(query))
      );

      return {
        totalUsers: parseInt(users.rows[0].count),
        totalVendors: parseInt(vendors.rows[0].count),
        totalOrganizations: parseInt(organizations.rows[0].count),
        totalWaitlistSubscribers: parseInt(waitlist.rows[0].count),
        totalActivities: parseInt(activities.rows[0].count),
        totalQuestionnaires: parseInt(questionnaires.rows[0].count),
        totalVendorWorks: parseInt(vendorWorks.rows[0].count),
        totalEvidenceFiles: parseInt(evidenceFiles.rows[0].count),
      };
    } catch (error) {
      this.logger.error('Error getting system stats:', error);
      throw new BadRequestException('Failed to get system stats');
    }
  }

  async performSystemCleanup(cleanupOptions: any) {
    try {
      // This is a placeholder for cleanup operations
      // Could include: old logs, temporary files, expired tokens, etc.
      this.logger.log('System cleanup performed', cleanupOptions);
      return { message: 'System cleanup completed successfully' };
    } catch (error) {
      this.logger.error('Error performing system cleanup:', error);
      throw new BadRequestException('Failed to perform system cleanup');
    }
  }

  // ============ TRUST PORTAL MANAGEMENT ============
  async getTrustPortalFeedback(filters: AdminFilters) {
    try {
      const { page = 1, limit = 20, status } = filters;
      const offset = (page - 1) * limit;

      let whereClause = '';
      const queryParams = [];
      
      if (status) {
        whereClause = 'WHERE status = $1';
        queryParams.push(status);
      }

      const query = `
        SELECT tpf.*, v.company_name as vendor_name
        FROM trust_portal_feedback tpf
        LEFT JOIN vendors v ON tpf.vendor_id = v.vendor_id
        ${whereClause}
        ORDER BY tpf.created_at DESC
        LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
      `;
      queryParams.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total
        FROM trust_portal_feedback
        ${whereClause}
      `;

      const [feedback, countResult] = await Promise.all([
        this.databaseService.query(query, queryParams),
        this.databaseService.query(countQuery, status ? [status] : []),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        feedback: feedback.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error getting trust portal feedback:', error);
      throw new BadRequestException('Failed to get trust portal feedback');
    }
  }

  async updateTrustPortalFeedback(id: string, updateData: any) {
    try {
      const allowedFields = ['status', 'priority'];
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      for (const field of allowedFields) {
        if (updateData[field] !== undefined) {
          updateFields.push(`${field} = $${paramIndex++}`);
          updateValues.push(updateData[field]);
        }
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No valid fields to update');
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.push(id);

      const query = `
        UPDATE trust_portal_feedback 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.databaseService.query(query, updateValues);

      if (result.rows.length === 0) {
        throw new NotFoundException('Feedback not found');
      }

      return { feedback: result.rows[0] };
    } catch (error) {
      this.logger.error('Error updating trust portal feedback:', error);
      throw new BadRequestException('Failed to update trust portal feedback');
    }
  }

  // ============ QUESTIONNAIRE MANAGEMENT ============
  async getAllQuestionnaires() {
    try {
      const query = `
        SELECT q.*, u.full_name as created_by_name, o.name as organization_name
        FROM questionnaires q
        LEFT JOIN users u ON q.created_by = u.id
        LEFT JOIN organizations o ON u.organization_id = o.id
        ORDER BY q.created_at DESC
      `;
      const result = await this.databaseService.query(query);
      return { questionnaires: result.rows };
    } catch (error) {
      this.logger.error('Error getting all questionnaires:', error);
      throw new BadRequestException('Failed to get questionnaires');
    }
  }

  async getQuestionnaireStats() {
    try {
      const totalQuery = 'SELECT COUNT(*) as total FROM questionnaires';
      const answersQuery = 'SELECT COUNT(*) as total FROM vendor_questionnaire_answers';
      
      const [total, answers] = await Promise.all([
        this.databaseService.query(totalQuery),
        this.databaseService.query(answersQuery),
      ]);

      return {
        totalQuestionnaires: parseInt(total.rows[0].total),
        totalAnswers: parseInt(answers.rows[0].total),
      };
    } catch (error) {
      this.logger.error('Error getting questionnaire stats:', error);
      throw new BadRequestException('Failed to get questionnaire stats');
    }
  }

  // ============ EVIDENCE FILES MANAGEMENT ============
  async getAllEvidence(filters: AdminFilters) {
    try {
      const { page = 1, limit = 20 } = filters;
      const offset = (page - 1) * limit;

      const query = `
        SELECT ef.*, v.company_name as vendor_name, u.full_name as uploaded_by_name
        FROM evidence_files ef
        LEFT JOIN vendors v ON ef.vendor_id = v.vendor_id
        LEFT JOIN users u ON ef.uploaded_by = u.id
        ORDER BY ef.uploaded_at DESC
        LIMIT $1 OFFSET $2
      `;

      const countQuery = 'SELECT COUNT(*) as total FROM evidence_files';

      const [evidence, countResult] = await Promise.all([
        this.databaseService.query(query, [limit, offset]),
        this.databaseService.query(countQuery),
      ]);

      const total = parseInt(countResult.rows[0].total);
      const totalPages = Math.ceil(total / limit);

      return {
        evidence: evidence.rows,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      this.logger.error('Error getting all evidence:', error);
      throw new BadRequestException('Failed to get evidence files');
    }
  }

  async getEvidenceStats() {
    try {
      const totalQuery = 'SELECT COUNT(*) as total, SUM(file_size) as total_size FROM evidence_files';
      const typeDistQuery = `
        SELECT mime_type, COUNT(*) as count, SUM(file_size) as total_size
        FROM evidence_files
        GROUP BY mime_type
        ORDER BY count DESC
      `;

      const [total, typeDistribution] = await Promise.all([
        this.databaseService.query(totalQuery),
        this.databaseService.query(typeDistQuery),
      ]);

      return {
        totalFiles: parseInt(total.rows[0].total),
        totalSize: parseInt(total.rows[0].total_size || 0),
        typeDistribution: typeDistribution.rows,
      };
    } catch (error) {
      this.logger.error('Error getting evidence stats:', error);
      throw new BadRequestException('Failed to get evidence stats');
    }
  }
} 