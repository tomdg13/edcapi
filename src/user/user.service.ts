import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { CreateUserDto, UpdateUserDto, UserStatus } from './user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Create a new user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if phone or email already exists
    const existingUser = await this.userRepository.findOne({
      where: [
        { phone: createUserDto.phone },
        { email: createUserDto.email },
      ],
    });

    if (existingUser) {
      if (existingUser.phone === createUserDto.phone) {
        throw new ConflictException('Phone number already exists');
      }
      if (existingUser.email === createUserDto.email) {
        throw new ConflictException('Email already exists');
      }
    }

    // Generate next USER_ID
    const nextUserId = await this.getNextUserId();

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    // Generate user code
    const userCode = await this.generateUserCode();

    // Create user entity with manual USER_ID
    const user = this.userRepository.create({
      userId: nextUserId,
      phone: createUserDto.phone,
      email: createUserDto.email,
      passwordHash: hashedPassword,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      userStatus: createUserDto.userStatus || UserStatus.ACTIVE,
      deviceId: createUserDto.deviceId,
      roleId: createUserDto.roleId,
      branchId: createUserDto.branchId,
      userCode,
      createdBy: createUserDto.createdBy || 'SYSTEM',
      modifiedBy: createUserDto.modifiedBy || 'SYSTEM',
    });

    return await this.userRepository.save(user);
  }

  /**
   * Get all users
   */
  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: [
        'userId',
        'phone',
        'email',
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
      order: {
        createdDate: 'DESC',
      },
    });
  }

  /**
   * Get user by ID
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
      select: [
        'userId',
        'phone',
        'email',
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { phone },
      select: [
        'userId',
        'phone',
        'email',
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with phone ${phone} not found`);
    }

    return user;
  }

  /**
   * Update user
   */
  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Check for conflicts if phone or email is being updated
    if (updateUserDto.phone || updateUserDto.email) {
      const conflictQuery = this.userRepository.createQueryBuilder('user')
        .where('user.userId != :id', { id });

      if (updateUserDto.phone) {
        conflictQuery.andWhere('user.phone = :phone', { phone: updateUserDto.phone });
      }

      if (updateUserDto.email) {
        conflictQuery.orWhere('user.email = :email', { email: updateUserDto.email });
      }

      const conflictUser = await conflictQuery.getOne();

      if (conflictUser) {
        if (conflictUser.phone === updateUserDto.phone) {
          throw new ConflictException('Phone number already exists');
        }
        if (conflictUser.email === updateUserDto.email) {
          throw new ConflictException('Email already exists');
        }
      }
    }

    // Hash password if provided
    if (updateUserDto.password) {
      const saltRounds = 10;
      updateUserDto['passwordHash'] = await bcrypt.hash(updateUserDto.password, saltRounds);
      delete updateUserDto.password;
    }

    // Update modified by
    updateUserDto.modifiedBy = updateUserDto.modifiedBy || 'SYSTEM';

    // Merge and save
    Object.assign(user, updateUserDto);
    return await this.userRepository.save(user);
  }

  /**
   * Delete user (soft delete by setting status to INACTIVE)
   */
  async remove(id: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { userId: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    // Soft delete by setting status to INACTIVE
    user.userStatus = UserStatus.INACTIVE;
    user.modifiedBy = 'SYSTEM';
    await this.userRepository.save(user);
  }

  /**
   * Hard delete user (completely remove from database)
   */
  async hardDelete(id: number): Promise<void> {
    const result = await this.userRepository.delete(id);
    
    if (result.affected === 0) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
  }

  /**
   * Generate next user code in format LDB + 6-digit number
   */
  private async generateUserCode(): Promise<string> {
    // Get the latest user code
    const lastUser = await this.userRepository
      .createQueryBuilder('user')
      .where('user.userCode LIKE :pattern', { pattern: 'LDB%' })
      .orderBy('user.userCode', 'DESC')
      .getOne();

    let nextNumber = 1;

    if (lastUser && lastUser.userCode) {
      // Extract the number part from the last user code
      const numberPart = lastUser.userCode.substring(3); // Remove 'LDB' prefix
      const lastNumber = parseInt(numberPart, 10);
      
      if (!isNaN(lastNumber) && lastNumber < 999999) {
        nextNumber = lastNumber + 1;
      } else if (lastNumber >= 999999) {
        throw new BadRequestException('Maximum user code limit reached (999999)');
      }
    }

    // Format the number with leading zeros (6 digits)
    const formattedNumber = nextNumber.toString().padStart(6, '0');
    return `LDB${formattedNumber}`;
  }

  /**
   * Generate next USER_ID manually
   */
  private async getNextUserId(): Promise<number> {
    try {
      // Use raw query to get the maximum USER_ID and add 1
      const result = await this.userRepository.query(
        'SELECT NVL(MAX(USER_ID), 0) + 1 as NEXT_ID FROM ED_USER'
      );
      
      if (result && result[0] && result[0].NEXT_ID) {
        return parseInt(result[0].NEXT_ID, 10);
      }
      
      // Fallback: start from 1 if no records exist
      return 1;
    } catch (error) {
      // If query fails, try alternative approach
      const maxUser = await this.userRepository
        .createQueryBuilder('user')
        .select('MAX(user.userId)', 'maxId')
        .getRawOne();
      
      const maxId = maxUser?.maxId || 0;
      return maxId + 1;
    }
  }

  /**
   * Verify user password
   */
  async verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Update last login date
   */
  async updateLastLogin(userId: number): Promise<void> {
    await this.userRepository.update(userId, {
      lastLoginDate: new Date(),
    });
  }

  /**
   * Get users by status
   */
  async findByStatus(status: string | UserStatus): Promise<User[]> {
    return await this.userRepository.find({
      where: { userStatus: status as UserStatus },
      select: [
        'userId',
        'phone',
        'email',
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
      order: {
        createdDate: 'DESC',
      },
    });
  }

  /**
   * Find user by email (for authentication purposes)
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
      select: [
        'userId',
        'phone',
        'email',
        'passwordHash', // Include password hash for authentication
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
    });
  }

  /**
   * Find user by user code
   */
  async findByUserCode(userCode: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { userCode },
      select: [
        'userId',
        'phone',
        'email',
        'firstName',
        'lastName',
        'userStatus',
        'userCode',
        'createdDate',
        'lastLoginDate',
        'createdBy',
        'modifiedBy',
        'deviceId',
        'roleId',
        'branchId',
      ],
    });
  }

  /**
   * Count total users
   */
  async countUsers(): Promise<number> {
    return await this.userRepository.count();
  }

  /**
   * Count users by status
   */
  async countUsersByStatus(status: string | UserStatus): Promise<number> {
    return await this.userRepository.count({
      where: { userStatus: status as UserStatus },
    });
  }

  /**
   * Get users with pagination
   */
  async findWithPagination(
    page: number = 1,
    limit: number = 10,
    status?: string | UserStatus,
  ): Promise<{ users: User[]; total: number; totalPages: number }> {
    const skip = (page - 1) * limit;
    
    const queryBuilder = this.userRepository.createQueryBuilder('user')
      .select([
        'user.userId',
        'user.phone',
        'user.email',
        'user.firstName',
        'user.lastName',
        'user.userStatus',
        'user.userCode',
        'user.createdDate',
        'user.lastLoginDate',
        'user.createdBy',
        'user.modifiedBy',
        'user.deviceId',
        'user.roleId',
        'user.branchId',
      ])
      .orderBy('user.createdDate', 'DESC')
      .skip(skip)
      .take(limit);

    if (status) {
      queryBuilder.where('user.userStatus = :status', { status: status as UserStatus });
    }

    const [users, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      users,
      total,
      totalPages,
    };
  }

  /**
   * Helper method to validate UserStatus
   */
  private isValidUserStatus(status: string): status is UserStatus {
    return Object.values(UserStatus).includes(status as UserStatus);
  }

  /**
   * Convert string to UserStatus with validation
   */
  private validateAndConvertStatus(status: string | UserStatus): UserStatus {
    if (typeof status === 'string') {
      if (!this.isValidUserStatus(status)) {
        throw new BadRequestException(`Invalid user status: ${status}. Valid values are: ${Object.values(UserStatus).join(', ')}`);
      }
      return status as UserStatus;
    }
    return status;
  }
}