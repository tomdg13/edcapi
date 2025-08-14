import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  IsNumber,
  IsEnum,
  Length,
  Matches,
  IsPhoneNumber,
  IsDateString,
  Min,
  Max,
  IsBoolean,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  PENDING = 'PENDING',
}

export class CreateUserDto {
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString({ message: 'Phone number must be a string' })
  @Length(1, 50, { message: 'Phone number must be between 1 and 50 characters' })
  // @IsPhoneNumber(null, { message: 'Phone number must be valid' }) // Uncomment for strict phone validation
  phone: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  @Transform(({ value }) => value?.toLowerCase()) // Convert email to lowercase
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  @Length(6, 255, { message: 'Password must be between 6 and 255 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim()) // Remove whitespace
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim()) // Remove whitespace
  lastName?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'User status must be ACTIVE, INACTIVE, SUSPENDED, or PENDING' })
  userStatus?: UserStatus = UserStatus.ACTIVE;

  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  @Length(1, 255, { message: 'Device ID must be between 1 and 255 characters' })
  deviceId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Role ID must be a number' })
  @Min(1, { message: 'Role ID must be greater than 0' })
  @Type(() => Number) // Transform string to number
  roleId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Branch ID must be a number' })
  @Min(1, { message: 'Branch ID must be greater than 0' })
  @Type(() => Number) // Transform string to number
  branchId?: number;

  @IsOptional()
  @IsString({ message: 'Created by must be a string' })
  @Length(1, 50, { message: 'Created by must be between 1 and 50 characters' })
  createdBy?: string;

  @IsOptional()
  @IsString({ message: 'Modified by must be a string' })
  @Length(1, 50, { message: 'Modified by must be between 1 and 50 characters' })
  modifiedBy?: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsString({ message: 'Phone number must be a string' })
  @Length(1, 50, { message: 'Phone number must be between 1 and 50 characters' })
  // @IsPhoneNumber(null, { message: 'Phone number must be valid' }) // Uncomment for strict phone validation
  phone?: string;

  @IsOptional()
  @IsEmail({}, { message: 'Email must be valid' })
  @Length(1, 255, { message: 'Email must be between 1 and 255 characters' })
  @Transform(({ value }) => value?.toLowerCase()) // Convert email to lowercase
  email?: string;

  @IsOptional()
  @IsString({ message: 'Password must be a string' })
  @Length(6, 255, { message: 'Password must be between 6 and 255 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  password?: string;

  @IsOptional()
  @IsString({ message: 'First name must be a string' })
  @Length(1, 100, { message: 'First name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim()) // Remove whitespace
  firstName?: string;

  @IsOptional()
  @IsString({ message: 'Last name must be a string' })
  @Length(1, 100, { message: 'Last name must be between 1 and 100 characters' })
  @Transform(({ value }) => value?.trim()) // Remove whitespace
  lastName?: string;

  @IsOptional()
  @IsEnum(UserStatus, { message: 'User status must be ACTIVE, INACTIVE, SUSPENDED, or PENDING' })
  userStatus?: UserStatus;

  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  @Length(1, 255, { message: 'Device ID must be between 1 and 255 characters' })
  deviceId?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Role ID must be a number' })
  @Min(1, { message: 'Role ID must be greater than 0' })
  @Type(() => Number) // Transform string to number
  roleId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Branch ID must be a number' })
  @Min(1, { message: 'Branch ID must be greater than 0' })
  @Type(() => Number) // Transform string to number
  branchId?: number;

  @IsOptional()
  @IsString({ message: 'Created by must be a string' })
  @Length(1, 50, { message: 'Created by must be between 1 and 50 characters' })
  createdBy?: string;

  @IsOptional()
  @IsString({ message: 'Modified by must be a string' })
  @Length(1, 50, { message: 'Modified by must be between 1 and 50 characters' })
  modifiedBy?: string;

  @IsOptional()
  @Type(() => Date)
  lastLoginDate?: Date;
}

export class UserResponseDto {
  userId: number;
  phone: string;
  email: string;
  firstName: string;
  lastName: string;
  userStatus: string;
  userCode: string;
  createdDate: Date;
  lastLoginDate: Date;
  createdBy: string;
  modifiedBy: string;
  deviceId: string;
  roleId: number;
  branchId: number;
}

export class SearchByPhoneDto {
  @IsNotEmpty({ message: 'Phone number is required for search' })
  @IsString({ message: 'Phone number must be a string' })
  @Length(1, 50, { message: 'Phone number must be between 1 and 50 characters' })
  phone: string;
}

export class SearchByEmailDto {
  @IsNotEmpty({ message: 'Email is required for search' })
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.toLowerCase())
  email: string;
}

export class SearchByUserCodeDto {
  @IsNotEmpty({ message: 'User code is required for search' })
  @IsString({ message: 'User code must be a string' })
  @Length(3, 10, { message: 'User code must be between 3 and 10 characters' })
  @Matches(/^LDB\d{6}$/, { message: 'User code must be in format LDB followed by 6 digits' })
  userCode: string;
}

export class VerifyPasswordDto {
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Email must be valid' })
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @IsNotEmpty({ message: 'Password is required' })
  @IsString({ message: 'Password must be a string' })
  password: string;
}

export class ChangePasswordDto {
  @IsNotEmpty({ message: 'Current password is required' })
  @IsString({ message: 'Current password must be a string' })
  currentPassword: string;

  @IsNotEmpty({ message: 'New password is required' })
  @IsString({ message: 'New password must be a string' })
  @Length(6, 255, { message: 'New password must be between 6 and 255 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain at least one lowercase letter, one uppercase letter, and one number',
  })
  newPassword: string;

  @IsOptional()
  @IsString({ message: 'Confirm password must be a string' })
  confirmPassword?: string;
}

export class UserFilterDto {
  @IsOptional()
  @IsEnum(UserStatus, { message: 'Status must be ACTIVE, INACTIVE, SUSPENDED, or PENDING' })
  status?: UserStatus;

  @IsOptional()
  @IsNumber({}, { message: 'Role ID must be a number' })
  @Min(1, { message: 'Role ID must be greater than 0' })
  @Type(() => Number)
  roleId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Branch ID must be a number' })
  @Min(1, { message: 'Branch ID must be greater than 0' })
  @Type(() => Number)
  branchId?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be greater than 0' })
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be greater than 0' })
  @Max(100, { message: 'Limit cannot be greater than 100' })
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsBoolean({ message: 'Paginate must be a boolean' })
  @Type(() => Boolean)
  paginate?: boolean = false;
}

export class UserStatsResponseDto {
  total: number;
  active: number;
  inactive: number;
  suspended: number;
  pending: number;
}

export class PaginatedUserResponseDto {
  users: UserResponseDto[];
  total: number;
  totalPages: number;
  currentPage: number;
  limit: number;
}

export class LoginUpdateDto {
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  deviceId?: string;

  @IsOptional()
  @IsString({ message: 'IP address must be a string' })
  ipAddress?: string;
}

export class BulkUserActionDto {
  @IsNotEmpty({ message: 'User IDs are required' })
  @IsNumber({}, { each: true, message: 'Each user ID must be a number' })
  @Type(() => Number)
  userIds: number[];

  @IsNotEmpty({ message: 'Action is required' })
  @IsEnum(['activate', 'suspend', 'delete'], { message: 'Action must be activate, suspend, or delete' })
  action: 'activate' | 'suspend' | 'delete';

  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  @Length(1, 255, { message: 'Reason must be between 1 and 255 characters' })
  reason?: string;
}