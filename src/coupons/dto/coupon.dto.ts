import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CouponPermissions } from '../entities/coupon.entity';

export class CouponPermissionsDto implements CouponPermissions {
  @ApiProperty({ required: false, description: 'Grants access to all features' })
  @IsOptional()
  @IsBoolean()
  full_access?: boolean;

  @ApiProperty({ required: false, description: 'Specific features to grant access to' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiProperty({ required: false, description: 'Override to specific plan' })
  @IsOptional()
  @IsString()
  plan_override?: string;

  @ApiProperty({ required: false, description: 'Grant unlimited questionnaires' })
  @IsOptional()
  @IsBoolean()
  unlimited_questionnaires?: boolean;

  @ApiProperty({ required: false, description: 'Grant unlimited vendors' })
  @IsOptional()
  @IsBoolean()
  unlimited_vendors?: boolean;

  @ApiProperty({ required: false, description: 'Grant unlimited users' })
  @IsOptional()
  @IsBoolean()
  unlimited_users?: boolean;

  @ApiProperty({ required: false, description: 'Grant unlimited storage' })
  @IsOptional()
  @IsBoolean()
  unlimited_storage?: boolean;

  @ApiProperty({ required: false, description: 'Grant unlimited frameworks' })
  @IsOptional()
  @IsBoolean()
  unlimited_frameworks?: boolean;

  @ApiProperty({ required: false, description: 'Bypass subscription requirements' })
  @IsOptional()
  @IsBoolean()
  bypass_subscription?: boolean;

  @ApiProperty({ required: false, description: 'Grant testing access' })
  @IsOptional()
  @IsBoolean()
  testing_access?: boolean;
}

export class CreateCouponDto {
  @ApiProperty({ description: 'Unique coupon code' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Display name for the coupon' })
  @IsString()
  name: string;

  @ApiProperty({ required: false, description: 'Description of what the coupon provides' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Permissions granted by this coupon' })
  @ValidateNested()
  @Type(() => CouponPermissionsDto)
  permissions: CouponPermissionsDto;

  @ApiProperty({ required: false, description: 'Maximum number of times this coupon can be used' })
  @IsOptional()
  @IsNumber()
  usage_limit?: number;

  @ApiProperty({ description: 'Date when coupon becomes valid' })
  @IsDateString()
  valid_from: string;

  @ApiProperty({ required: false, description: 'Date when coupon expires' })
  @IsOptional()
  @IsDateString()
  valid_until?: string;
}

export class ValidateCouponDto {
  @ApiProperty({ description: 'Coupon code to validate' })
  @IsString()
  code: string;
}

export class ApplyCouponDto {
  @ApiProperty({ description: 'Coupon code to apply' })
  @IsString()
  code: string;
}

export class CouponResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description: string;

  @ApiProperty()
  permissions: CouponPermissions;

  @ApiProperty()
  usage_limit?: number;

  @ApiProperty()
  usage_count: number;

  @ApiProperty()
  valid_from: string;

  @ApiProperty()
  valid_until?: string;

  @ApiProperty()
  is_active: boolean;

  @ApiProperty()
  created_by: string;

  @ApiProperty()
  created_at: string;
}

export class CouponValidationResponseDto {
  @ApiProperty()
  valid: boolean;

  @ApiProperty()
  coupon?: CouponResponseDto;

  @ApiProperty()
  message: string;

  @ApiProperty()
  permissions?: CouponPermissions;
}

export class ApplyCouponResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty()
  coupon?: CouponResponseDto;

  @ApiProperty()
  expires_at?: string;
} 