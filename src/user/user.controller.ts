// src/user/user.controller.ts - COMPLETE USER CONTROLLER FOR ED_USER WITH PHONE
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  ParseIntPipe,
  UsePipes,
} from '@nestjs/common';
import { UserService } from './user.service';

// DTOs for validation (you can create separate DTO files)
import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  MaxLength, 
  IsOptional, 
  IsIn,
  IsNumber,
  Min,
  Max,
  Matches
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTO Classes for validation
class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]{8,20}$/, { message: 'Invalid phone number format' })
  phone: string;

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(255)
  email: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]{8,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  first_name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  last_name?: string;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  user_status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

  @IsOptional()
  @IsIn(['Y', 'N'])
  is_email_verified?: 'Y' | 'N';

  @IsOptional()
  @IsString()
  @MaxLength(50)
  role?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  language?: string;
}

class UserQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'PENDING'])
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['USER_ID', 'PHONE', 'EMAIL', 'FIRST_NAME', 'LAST_NAME', 'CREATED_DATE', 'LAST_LOGIN_DATE'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';
}

class LockAccountDto {
  @IsOptional()
  @Transform(({ value }) => new Date(value))
  lock_until?: Date;
}

class BulkActionDto {
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  user_ids: number[];

  @IsNotEmpty()
  @IsIn(['activate', 'deactivate', 'suspend', 'lock', 'unlock'])
  action: 'activate' | 'deactivate' | 'suspend' | 'lock' | 'unlock';
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // GET /users - Get all users with filtering and pagination
  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: UserQueryDto) {
    try {
      return await this.userService.findAll(query);
    } catch (error) {
      throw error;
    }
  }

  // GET /users/stats - Get user statistics
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    try {
      return await this.userService.getStats();
    } catch (error) {
      throw error;
    }
  }

  // GET /users/search/:identifier - Find user by phone or email
  @Get('search/:identifier')
  @HttpCode(HttpStatus.OK)
  async findByIdentifier(@Param('identifier') identifier: string) {
    try {
      return await this.userService.findByPhoneOrEmail(identifier);
    } catch (error) {
      throw error;
    }
  }

  // GET /users/by-status/:status - Get users by status
  @Get('by-status/:status')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findByStatus(
    @Param('status') status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING',
    @Query() query: Omit<UserQueryDto, 'status'>
  ) {
    try {
      return await this.userService.findAll({ ...query, status });
    } catch (error) {
      throw error;
    }
  }

  // GET /users/:id - Get user by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  // POST /users - Create new user
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  async create(@Body() createUserDto: CreateUserDto) {
    try {
      return await this.userService.create(createUserDto);
    } catch (error) {
      throw error;
    }
  }

  // POST /users/bulk-action - Bulk operations on multiple users
  @Post('bulk-action')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async bulkAction(@Body() bulkActionDto: BulkActionDto) {
    try {
      const results = [];
      
      for (const userId of bulkActionDto.user_ids) {
        try {
          let result;
          switch (bulkActionDto.action) {
            case 'activate':
              result = await this.userService.update(userId, { user_status: 'ACTIVE' });
              break;
            case 'deactivate':
              result = await this.userService.delete(userId);
              break;
            case 'suspend':
              result = await this.userService.update(userId, { user_status: 'SUSPENDED' });
              break;
            case 'lock':
              result = await this.userService.lockAccount(userId);
              break;
            case 'unlock':
              result = await this.userService.unlockAccount(userId);
              break;
            default:
              throw new Error('Invalid action');
          }
          
          results.push({
            user_id: userId,
            status: 'success',
            result: result
          });
        } catch (error) {
          results.push({
            user_id: userId,
            status: 'error',
            error: error.message
          });
        }
      }

      return {
        status: 'success',
        message: `Bulk ${bulkActionDto.action} operation completed`,
        data: {
          action: bulkActionDto.action,
          results: results,
          summary: {
            total: bulkActionDto.user_ids.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id - Update user
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    try {
      return await this.userService.update(id, updateUserDto);
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id/activate - Activate user
  @Patch(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activateUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.update(id, { user_status: 'ACTIVE' });
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id/deactivate - Deactivate user
  @Patch(':id/deactivate') 
  @HttpCode(HttpStatus.OK)
  async deactivateUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.delete(id);
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id/suspend - Suspend user
  @Patch(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspendUser(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.update(id, { user_status: 'SUSPENDED' });
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id/lock - Lock user account
  @Patch(':id/lock')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async lockAccount(
    @Param('id', ParseIntPipe) id: number,
    @Body() lockDto: LockAccountDto,
  ) {
    try {
      return await this.userService.lockAccount(id, lockDto.lock_until);
    } catch (error) {
      throw error;
    }
  }

  // PATCH /users/:id/unlock - Unlock user account
  @Patch(':id/unlock')
  @HttpCode(HttpStatus.OK)
  async unlockAccount(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.unlockAccount(id);
    } catch (error) {
      throw error;
    }
  }

  // POST /users/:id/verify-email - Manually verify user email
  @Post(':id/verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.update(id, { is_email_verified: 'Y' });
    } catch (error) {
      throw error;
    }
  }

  // POST /users/:id/unverify-email - Unverify user email
  @Post(':id/unverify-email')
  @HttpCode(HttpStatus.OK)
  async unverifyEmail(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.update(id, { is_email_verified: 'N' });
    } catch (error) {
      throw error;
    }
  }

  // DELETE /users/:id - Soft delete user (same as deactivate)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.userService.delete(id);
    } catch (error) {
      throw error;
    }
  }

  // GET /users/:id/profile - Get user profile information
  @Get(':id/profile')
  @HttpCode(HttpStatus.OK)
  async getUserProfile(@Param('id', ParseIntPipe) id: number) {
    try {
      const userResult = await this.userService.findOne(id);
      
      // Return limited profile information
      const user = userResult.data;
      return {
        status: 'success',
        message: 'User profile retrieved successfully',
        data: {
          user_id: user.user_id,
          phone: user.phone,
          email: user.email,
          full_name: user.full_name,
          user_status: user.user_status,
          is_email_verified: user.is_email_verified,
          created_date: user.created_date,
          last_login_date: user.last_login_date,
          role: user.role,
          language: user.language
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // GET /users/:id/login-history - Get basic user login information
  @Get(':id/login-history')
  @HttpCode(HttpStatus.OK)
  async getLoginHistory(@Param('id', ParseIntPipe) id: number) {
    try {
      const userResult = await this.userService.findOne(id);
      const user = userResult.data;
      
      return {
        status: 'success',
        message: 'User login history retrieved successfully',
        data: {
          user_id: id,
          phone: user.phone,
          last_login_date: user.last_login_date,
          failed_login_attempts: user.failed_login_attempts,
          is_account_locked: user.is_account_locked,
          account_locked_until: user.account_locked_until,
          user_status: user.user_status
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // POST /users/export - Export users data information
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportUsers(
    @Body() exportDto: { 
      format?: 'csv' | 'excel' | 'json'; 
      filters?: UserQueryDto 
    }
  ) {
    try {
      const users = await this.userService.findAll(exportDto.filters || {});
      
      return {
        status: 'success',
        message: 'Export data prepared successfully',
        data: {
          format: exportDto.format || 'json',
          total_records: users.data.length,
          users: users.data,
          pagination: users.pagination,
          // In real implementation, you'd generate the actual file
          export_info: {
            generated_at: new Date().toISOString(),
            total_users: users.data.length,
            format: exportDto.format || 'json'
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }
}