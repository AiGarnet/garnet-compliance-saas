import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, SubscriptionPlan, OrganizationSettings } from './entities/organization.entity';
import { UserEntity } from '../auth/entities/user.entity';

export interface CreateOrganizationDto {
  name: string;
  domain?: string;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  settings?: OrganizationSettings;
}

export interface UpdateOrganizationDto {
  name?: string;
  domain?: string;
  subscriptionPlan?: SubscriptionPlan;
  maxUsers?: number;
  isActive?: boolean;
  settings?: OrganizationSettings;
}

export interface OrganizationMemberDto {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private organizationRepository: Repository<Organization>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Create a new organization
   */
  async createOrganization(createDto: CreateOrganizationDto): Promise<Organization> {
    // Check if organization with same name already exists
    const existingOrg = await this.organizationRepository.findOne({
      where: { name: createDto.name }
    });

    if (existingOrg) {
      throw new ConflictException(`Organization with name "${createDto.name}" already exists`);
    }

    // Check if domain is already taken (if provided)
    if (createDto.domain) {
      const existingDomain = await this.organizationRepository.findOne({
        where: { domain: createDto.domain }
      });

      if (existingDomain) {
        throw new ConflictException(`Domain "${createDto.domain}" is already registered`);
      }
    }

    const organization = this.organizationRepository.create(createDto);
    return await this.organizationRepository.save(organization);
  }

  /**
   * Get all organizations with pagination
   */
  async getAllOrganizations(
    page: number = 1,
    limit: number = 10,
    includeUsers: boolean = false
  ): Promise<{ organizations: Organization[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .orderBy('organization.created_at', 'DESC')
      .skip(skip)
      .take(limit);

    if (includeUsers) {
      queryBuilder.leftJoinAndSelect('organization.users', 'users');
    }

    const [organizations, total] = await queryBuilder.getManyAndCount();

    return {
      organizations,
      total,
      page,
      limit
    };
  }

  /**
   * Get organization by ID
   */
  async getOrganizationById(id: string, includeUsers: boolean = false): Promise<Organization> {
    const queryBuilder = this.organizationRepository
      .createQueryBuilder('organization')
      .where('organization.id = :id', { id });

    if (includeUsers) {
      queryBuilder.leftJoinAndSelect('organization.users', 'users');
    }

    const organization = await queryBuilder.getOne();

    if (!organization) {
      throw new NotFoundException(`Organization with ID ${id} not found`);
    }

    return organization;
  }

  /**
   * Get organization by domain
   */
  async getOrganizationByDomain(domain: string): Promise<Organization | null> {
    return await this.organizationRepository.findOne({
      where: { domain },
      relations: ['users']
    });
  }

  /**
   * Update organization
   */
  async updateOrganization(id: string, updateDto: UpdateOrganizationDto): Promise<Organization> {
    const organization = await this.getOrganizationById(id);

    // Check for name conflicts (if name is being changed)
    if (updateDto.name && updateDto.name !== organization.name) {
      const existingOrg = await this.organizationRepository.findOne({
        where: { name: updateDto.name }
      });

      if (existingOrg) {
        throw new ConflictException(`Organization with name "${updateDto.name}" already exists`);
      }
    }

    // Check for domain conflicts (if domain is being changed)
    if (updateDto.domain && updateDto.domain !== organization.domain) {
      const existingDomain = await this.organizationRepository.findOne({
        where: { domain: updateDto.domain }
      });

      if (existingDomain) {
        throw new ConflictException(`Domain "${updateDto.domain}" is already registered`);
      }
    }

    // Merge settings if provided
    if (updateDto.settings) {
      updateDto.settings = {
        ...organization.settings,
        ...updateDto.settings
      };
    }

    await this.organizationRepository.update(id, updateDto);
    return await this.getOrganizationById(id);
  }

  /**
   * Delete organization (soft delete by setting isActive to false)
   */
  async deleteOrganization(id: string): Promise<void> {
    const organization = await this.getOrganizationById(id, true);

    // Check if organization has users
    if (organization.users && organization.users.length > 0) {
      throw new BadRequestException(
        `Cannot delete organization "${organization.name}" because it has ${organization.users.length} users. Please transfer or remove users first.`
      );
    }

    await this.organizationRepository.update(id, { isActive: false });
  }

  /**
   * Get organization members
   */
  async getOrganizationMembers(organizationId: string): Promise<OrganizationMemberDto[]> {
    // Verify organization exists
    await this.getOrganizationById(organizationId);

    const users = await this.userRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' }
    });

    return users.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt
    }));
  }

  /**
   * Add user to organization
   */
  async addUserToOrganization(organizationId: string, userId: string): Promise<void> {
    const organization = await this.getOrganizationById(organizationId, true);
    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.organizationId) {
      throw new BadRequestException(`User is already assigned to an organization`);
    }

    // Check user limit
    if (!organization.canAddUsers) {
      throw new BadRequestException(
        `Organization "${organization.name}" has reached its user limit of ${organization.maxUsers}`
      );
    }

    await this.userRepository.update(userId, { organizationId });
  }

  /**
   * Remove user from organization
   */
  async removeUserFromOrganization(organizationId: string, userId: string): Promise<void> {
    // Verify organization exists
    await this.getOrganizationById(organizationId);

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (user.organizationId !== organizationId) {
      throw new BadRequestException(`User is not a member of this organization`);
    }

    await this.userRepository.update(userId, { organizationId: null });
  }

  /**
   * Get organization statistics
   */
  async getOrganizationStats(organizationId: string): Promise<{
    userCount: number;
    maxUsers: number;
    roleDistribution: { [role: string]: number };
    subscriptionPlan: SubscriptionPlan;
    isActive: boolean;
  }> {
    const organization = await this.getOrganizationById(organizationId, true);
    
    const roleDistribution = organization.users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {} as { [role: string]: number });

    return {
      userCount: organization.currentUserCount,
      maxUsers: organization.maxUsers,
      roleDistribution,
      subscriptionPlan: organization.subscriptionPlan,
      isActive: organization.isActive
    };
  }

  /**
   * Auto-assign user to organization based on email domain
   */
  async autoAssignUserByDomain(userEmail: string): Promise<Organization | null> {
    const domain = userEmail.split('@')[1];
    
    if (!domain) {
      return null;
    }

    const organization = await this.getOrganizationByDomain(domain);
    
    if (!organization || !organization.isActive || !organization.canAddUsers) {
      return null;
    }

    return organization;
  }
} 