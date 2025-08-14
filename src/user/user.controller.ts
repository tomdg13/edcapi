import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpStatus,
  HttpCode,
  ParseIntPipe,
  ValidationPipe,
  UseGuards,
  SetMetadata,
  Request,
  DefaultValuePipe,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserResponseDto,
  SearchByPhoneDto,
  UserStatus,
} from './user.dto';
import { User } from './user.entity';

// Create a decorator to bypass JWT authentication for specific endpoints
export const Public = () => SetMetadata('isPublic', true);

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Create a new user
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  // @Public() // Uncomment if you want to allow user registration without authentication
  async create(
    @Body(new ValidationPipe()) createUserDto: CreateUserDto,
    @Request() req?: any, // JWT user info from your auth system
  ): Promise<User> {
    // Set createdBy from JWT token if available
    if (req?.user?.username || req?.user?.userId) {
      createUserDto.createdBy = req.user.username || req.user.userId.toString();
      createUserDto.modifiedBy = req.user.username || req.user.userId.toString();
    }
    
    return await this.userService.create(createUserDto);
  }

  /**
   * Get all users with optional filtering and pagination
   */
  @Get()
  async findAll(
    @Query('status') status?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('paginate') paginate?: string,
  ): Promise<User[] | { users: User[]; total: number; totalPages: number }> {
    // If pagination is requested
    if (paginate === 'true') {
      return await this.userService.findWithPagination(page, limit, status);
    }
    
    // Regular filtering
    if (status) {
      return await this.userService.findByStatus(status);
    }
    
    return await this.userService.findAll();
  }

  /**
   * Get user by ID
   */
  @Get(':id')
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<User> {
    return await this.userService.findOne(id);
  }

  /**
   * Search user by phone number (GET method)
   */
  @Get('search/phone')
  async findByPhone(@Query('phone') phone: string): Promise<User> {
    if (!phone) {
      throw new Error('Phone number is required');
    }
    return await this.userService.findByPhone(phone);
  }

  /**
   * Search user by phone number (POST method with body payload)
   */
  @Post('search/phone')
  @HttpCode(HttpStatus.OK)
  async searchByPhone(
    @Body(new ValidationPipe()) searchDto: SearchByPhoneDto,
  ): Promise<User> {
    return await this.userService.findByPhone(searchDto.phone);
  }

  /**
   * Search user by email
   */
  @Get('search/email')
  async findByEmail(@Query('email') email: string): Promise<User> {
    if (!email) {
      throw new Error('Email is required');
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Search user by user code
   */
  @Get('search/code')
  async findByUserCode(@Query('userCode') userCode: string): Promise<User> {
    if (!userCode) {
      throw new Error('User code is required');
    }
    const user = await this.userService.findByUserCode(userCode);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  /**
   * Update user
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(new ValidationPipe()) updateUserDto: UpdateUserDto,
    @Request() req?: any, // JWT user info
  ): Promise<User> {
    // Set modifiedBy from JWT token if available
    if (req?.user?.username || req?.user?.userId) {
      updateUserDto.modifiedBy = req.user.username || req.user.userId.toString();
    }
    
    return await this.userService.update(id, updateUserDto);
  }

  /**
   * Soft delete user (set status to INACTIVE)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.userService.remove(id);
  }

  /**
   * Hard delete user (completely remove from database)
   */
  @Delete(':id/hard')
  @HttpCode(HttpStatus.NO_CONTENT)
  async hardDelete(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return await this.userService.hardDelete(id);
  }

  /**
   * Update user's last login date
   */
  @Post(':id/login')
  @HttpCode(HttpStatus.OK)
  async updateLastLogin(@Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    await this.userService.updateLastLogin(id);
    return { message: 'Last login updated successfully' };
  }

  /**
   * Get user statistics
   */
  @Get('stats/count')
  async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    suspended: number;
    pending: number;
  }> {
    const [total, active, inactive, suspended, pending] = await Promise.all([
      this.userService.countUsers(),
      this.userService.countUsersByStatus(UserStatus.ACTIVE),
      this.userService.countUsersByStatus(UserStatus.INACTIVE),
      this.userService.countUsersByStatus(UserStatus.SUSPENDED),
      this.userService.countUsersByStatus(UserStatus.PENDING),
    ]);

    return {
      total,
      active,
      inactive,
      suspended,
      pending,
    };
  }

  /**
   * Verify user password (for authentication purposes)
   */
  @Post('verify-password')
  @HttpCode(HttpStatus.OK)
  async verifyPassword(
    @Body() body: { email: string; password: string },
  ): Promise<{ valid: boolean; user?: User }> {
    const user = await this.userService.findByEmail(body.email);
    
    if (!user) {
      return { valid: false };
    }

    const isValid = await this.userService.verifyPassword(body.password, user.passwordHash);
    
    if (isValid) {
      // Remove password hash from response
      const { passwordHash, ...userWithoutPassword } = user;
      return { valid: true, user: userWithoutPassword as User };
    }

    return { valid: false };
  }

  /**
   * Change user password
   */
  @Put(':id/password')
  async changePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { currentPassword: string; newPassword: string },
    @Request() req?: any,
  ): Promise<{ message: string }> {
    // Get user with password hash
    const user = await this.userService.findByEmail(
      (await this.userService.findOne(id)).email
    );

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await this.userService.verifyPassword(
      body.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update with new password
    const updateDto: UpdateUserDto = {
      password: body.newPassword,
    };

    if (req?.user?.username || req?.user?.userId) {
      updateDto.modifiedBy = req.user.username || req.user.userId.toString();
    }

    await this.userService.update(id, updateDto);

    return { message: 'Password updated successfully' };
  }

  /**
   * Activate user
   */
  @Put(':id/activate')
  async activateUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req?: any,
  ): Promise<User> {
    const updateDto: UpdateUserDto = {
      userStatus: UserStatus.ACTIVE,
    };

    if (req?.user?.username || req?.user?.userId) {
      updateDto.modifiedBy = req.user.username || req.user.userId.toString();
    }

    return await this.userService.update(id, updateDto);
  }

  /**
   * Suspend user
   */
  @Put(':id/suspend')
  async suspendUser(
    @Param('id', ParseIntPipe) id: number,
    @Request() req?: any,
  ): Promise<User> {
    const updateDto: UpdateUserDto = {
      userStatus: UserStatus.SUSPENDED,
    };

    if (req?.user?.username || req?.user?.userId) {
      updateDto.modifiedBy = req.user.username || req.user.userId.toString();
    }

    return await this.userService.update(id, updateDto);
  }

  /**
   * Get users by role ID
   */
  @Get('role/:roleId')
  async getUsersByRole(
    @Param('roleId', ParseIntPipe) roleId: number,
  ): Promise<User[]> {
    // This would require adding a method to the service
    // For now, we'll use findAll and filter (not optimal for large datasets)
    const allUsers = await this.userService.findAll();
    return allUsers.filter(user => user.roleId === roleId);
  }

  /**
   * Get users by branch ID
   */
  @Get('branch/:branchId')
  async getUsersByBranch(
    @Param('branchId', ParseIntPipe) branchId: number,
  ): Promise<User[]> {
    // This would require adding a method to the service
    // For now, we'll use findAll and filter (not optimal for large datasets)
    const allUsers = await this.userService.findAll();
    return allUsers.filter(user => user.branchId === branchId);
  }
}