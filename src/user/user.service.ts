// src/user/user.service.ts - COMPLETE USER SERVICE FOR ED_USER WITH PHONE
import { 
  Injectable, 
  HttpException, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// Interfaces for type safety
interface UserQueryParams {
  page?: number;
  limit?: number;
  status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface CreateUserData {
  phone: string;
  email: string;
  password: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  language?: string;
}

interface UpdateUserData {
  phone?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  user_status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
  is_email_verified?: 'Y' | 'N';
  role?: string;
  language?: string;
}

@Injectable()
export class UserService {
  constructor(private dataSource: DataSource) {}

  // Get all users with enhanced filtering, pagination, and error handling
  async findAll(queryParams: UserQueryParams = {}): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        search,
        sortBy = 'CREATED_DATE',
        sortOrder = 'DESC'
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params: any = {};

      // Build dynamic WHERE clause
      if (status) {
        whereClause += ' AND USER_STATUS = :status';
        params.status = status;
      }

      if (search) {
        whereClause += ` AND (
          UPPER(PHONE) LIKE UPPER(:search) OR 
          UPPER(EMAIL) LIKE UPPER(:search) OR 
          UPPER(FIRST_NAME) LIKE UPPER(:search) OR 
          UPPER(LAST_NAME) LIKE UPPER(:search)
        )`;
        params.search = `%${search}%`;
      }

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM ED_USER ${whereClause}`;
      const countResult = await this.dataSource.query(countQuery, Object.values(params));
      const total = parseInt(countResult[0]?.total || '0');

      // Main query with pagination
      const query = `
        SELECT 
          USER_ID,
          PHONE,
          EMAIL,
          FIRST_NAME,
          LAST_NAME,
          USER_STATUS,
          IS_EMAIL_VERIFIED,
          FAILED_LOGIN_ATTEMPTS,
          IS_ACCOUNT_LOCKED,
          ACCOUNT_LOCKED_UNTIL,
          CREATED_DATE,
          LAST_LOGIN_DATE,
          LAST_MODIFIED_DATE,
          ROLE,
          LANGUAGE
        FROM ED_USER 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      const users = await this.dataSource.query(query, Object.values(params));

      // Format response data
      const formattedUsers = users.map(user => this.formatUserResponse(user));

      return {
        status: 'success',
        message: 'Users retrieved successfully',
        data: formattedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };

    } catch (error) {
      console.error('Error fetching users:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch users',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get user by ID
  async findOne(id: number): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID provided');
      }

      const query = `
        SELECT 
          USER_ID, PHONE, EMAIL, FIRST_NAME, LAST_NAME,
          USER_STATUS, IS_EMAIL_VERIFIED, FAILED_LOGIN_ATTEMPTS,
          IS_ACCOUNT_LOCKED, ACCOUNT_LOCKED_UNTIL, CREATED_DATE,
          LAST_LOGIN_DATE, LAST_MODIFIED_DATE, ROLE, LANGUAGE
        FROM ED_USER 
        WHERE USER_ID = :id
      `;

      const result = await this.dataSource.query(query, [id]);
      const user = result[0];

      if (!user) {
        throw new NotFoundException(`User with ID ${id} not found`);
      }

      return {
        status: 'success',
        message: 'User retrieved successfully',
        data: this.formatUserResponse(user)
      };

    } catch (error) {
      console.error('Error fetching user:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch user',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get user by phone or email
  async findByPhoneOrEmail(identifier: string): Promise<any> {
    try {
      if (!identifier) {
        throw new BadRequestException('Phone or email is required');
      }

      const query = `
        SELECT 
          USER_ID, PHONE, EMAIL, FIRST_NAME, LAST_NAME,
          USER_STATUS, IS_EMAIL_VERIFIED, FAILED_LOGIN_ATTEMPTS,
          IS_ACCOUNT_LOCKED, ACCOUNT_LOCKED_UNTIL, CREATED_DATE,
          LAST_LOGIN_DATE, ROLE, LANGUAGE
        FROM ED_USER 
        WHERE PHONE = :identifier OR EMAIL = :identifier
      `;

      const result = await this.dataSource.query(query, [identifier]);
      const user = result[0];

      if (!user) {
        throw new NotFoundException(`User with phone/email ${identifier} not found`);
      }

      return {
        status: 'success',
        message: 'User retrieved successfully',
        data: this.formatUserResponse(user)
      };

    } catch (error) {
      console.error('Error fetching user by identifier:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch user',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create new user
  async create(userData: CreateUserData): Promise<any> {
    try {
      // Validate required fields
      if (!userData.phone || !userData.email || !userData.password) {
        throw new BadRequestException('Phone, email, and password are required');
      }

      // Validate phone format (basic validation)
      const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
      if (!phoneRegex.test(userData.phone)) {
        throw new BadRequestException('Invalid phone number format');
      }

      // Check if phone or email already exists
      const existsQuery = `
        SELECT USER_ID FROM ED_USER 
        WHERE PHONE = :phone OR EMAIL = :email
      `;
      
      const existingUser = await this.dataSource.query(existsQuery, [userData.phone, userData.email]);

      if (existingUser.length > 0) {
        throw new ConflictException('Phone number or email already exists');
      }

      // Hash password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

      // Insert new user
      const insertQuery = `
        INSERT INTO ED_USER (
          PHONE, EMAIL, PASSWORD_HASH, FIRST_NAME, LAST_NAME,
          USER_STATUS, IS_EMAIL_VERIFIED, ROLE, LANGUAGE, CREATED_BY
        ) VALUES (
          :phone, :email, :passwordHash, :firstName, :lastName,
          'PENDING', 'N', :role, :language, 'SYSTEM'
        )
      `;

      const result = await this.dataSource.query(insertQuery, [
        userData.phone,
        userData.email,
        hashedPassword,
        userData.first_name || null,
        userData.last_name || null,
        userData.role || 'USER',
        userData.language || 'EN'
      ]);

      return {
        status: 'success',
        message: 'User created successfully',
        data: {
          user_id: result.insertId,
          phone: userData.phone,
          email: userData.email,
          first_name: userData.first_name,
          last_name: userData.last_name,
          user_status: 'PENDING'
        }
      };

    } catch (error) {
      console.error('Error creating user:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to create user',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update user
  async update(id: number, updateData: UpdateUserData): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Check if user exists
      await this.findOne(id);

      // Check for conflicts if updating phone or email
      if (updateData.phone || updateData.email) {
        const conflictQuery = `
          SELECT USER_ID FROM ED_USER 
          WHERE (PHONE = :phone OR EMAIL = :email) AND USER_ID != :id
        `;
        
        const conflicts = await this.dataSource.query(conflictQuery, [
          updateData.phone || '',
          updateData.email || '',
          id
        ]);

        if (conflicts.length > 0) {
          throw new ConflictException('Phone number or email already exists');
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.phone !== undefined) {
        updateFields.push('PHONE = ?');
        params.push(updateData.phone);
      }
      if (updateData.email !== undefined) {
        updateFields.push('EMAIL = ?');
        params.push(updateData.email);
      }
      if (updateData.first_name !== undefined) {
        updateFields.push('FIRST_NAME = ?');
        params.push(updateData.first_name);
      }
      if (updateData.last_name !== undefined) {
        updateFields.push('LAST_NAME = ?');
        params.push(updateData.last_name);
      }
      if (updateData.user_status !== undefined) {
        updateFields.push('USER_STATUS = ?');
        params.push(updateData.user_status);
      }
      if (updateData.is_email_verified !== undefined) {
        updateFields.push('IS_EMAIL_VERIFIED = ?');
        params.push(updateData.is_email_verified);
      }
      if (updateData.role !== undefined) {
        updateFields.push('ROLE = ?');
        params.push(updateData.role);
      }
      if (updateData.language !== undefined) {
        updateFields.push('LANGUAGE = ?');
        params.push(updateData.language);
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      updateFields.push('LAST_MODIFIED_DATE = SYSDATE');
      updateFields.push('MODIFIED_BY = ?');
      params.push('SYSTEM');
      params.push(id);

      const updateQuery = `
        UPDATE ED_USER 
        SET ${updateFields.join(', ')}
        WHERE USER_ID = ?
      `;

      await this.dataSource.query(updateQuery, params);

      // Return updated user
      const updatedUser = await this.findOne(id);
      return {
        status: 'success',
        message: 'User updated successfully',
        data: updatedUser.data
      };

    } catch (error) {
      console.error('Error updating user:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to update user',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Soft delete user (set status to INACTIVE)
  async delete(id: number): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Check if user exists
      await this.findOne(id);

      const updateQuery = `
        UPDATE ED_USER 
        SET USER_STATUS = 'INACTIVE',
            LAST_MODIFIED_DATE = SYSDATE,
            MODIFIED_BY = 'SYSTEM'
        WHERE USER_ID = ?
      `;

      await this.dataSource.query(updateQuery, [id]);

      return {
        status: 'success',
        message: 'User deleted successfully',
        data: { user_id: id, status: 'INACTIVE' }
      };

    } catch (error) {
      console.error('Error deleting user:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to delete user',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get user statistics
  async getStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN USER_STATUS = 'ACTIVE' THEN 1 ELSE 0 END) as active_users,
          SUM(CASE WHEN USER_STATUS = 'INACTIVE' THEN 1 ELSE 0 END) as inactive_users,
          SUM(CASE WHEN USER_STATUS = 'SUSPENDED' THEN 1 ELSE 0 END) as suspended_users,
          SUM(CASE WHEN USER_STATUS = 'PENDING' THEN 1 ELSE 0 END) as pending_users,
          SUM(CASE WHEN IS_ACCOUNT_LOCKED = 'Y' THEN 1 ELSE 0 END) as locked_accounts,
          SUM(CASE WHEN IS_EMAIL_VERIFIED = 'Y' THEN 1 ELSE 0 END) as verified_emails,
          SUM(CASE WHEN LAST_LOGIN_DATE >= SYSDATE - 30 THEN 1 ELSE 0 END) as active_last_30_days
        FROM ED_USER
      `;

      const result = await this.dataSource.query(query);

      return {
        status: 'success',
        message: 'User statistics retrieved successfully',
        data: result[0]
      };

    } catch (error) {
      console.error('Error fetching user statistics:', error.message);

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch user statistics',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Lock user account
  async lockAccount(id: number, lockUntil?: Date): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Check if user exists
      await this.findOne(id);

      const lockUntilValue = lockUntil || new Date(Date.now() + 30 * 60 * 1000); // 30 minutes default

      const updateQuery = `
        UPDATE ED_USER 
        SET IS_ACCOUNT_LOCKED = 'Y',
            ACCOUNT_LOCKED_UNTIL = ?,
            LAST_MODIFIED_DATE = SYSDATE,
            MODIFIED_BY = 'SYSTEM'
        WHERE USER_ID = ?
      `;

      await this.dataSource.query(updateQuery, [lockUntilValue, id]);

      return {
        status: 'success',
        message: 'User account locked successfully',
        data: { user_id: id, locked_until: lockUntilValue }
      };

    } catch (error) {
      console.error('Error locking user account:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to lock user account',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Unlock user account
  async unlockAccount(id: number): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid user ID provided');
      }

      // Check if user exists
      await this.findOne(id);

      const updateQuery = `
        UPDATE ED_USER 
        SET IS_ACCOUNT_LOCKED = 'N',
            ACCOUNT_LOCKED_UNTIL = NULL,
            FAILED_LOGIN_ATTEMPTS = 0,
            LAST_MODIFIED_DATE = SYSDATE,
            MODIFIED_BY = 'SYSTEM'
        WHERE USER_ID = ?
      `;

      await this.dataSource.query(updateQuery, [id]);

      return {
        status: 'success',
        message: 'User account unlocked successfully',
        data: { user_id: id, status: 'unlocked' }
      };

    } catch (error) {
      console.error('Error unlocking user account:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to unlock user account',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Private helper method to format user response
  private formatUserResponse(user: any) {
    return {
      user_id: user.USER_ID,
      phone: user.PHONE,
      email: user.EMAIL,
      first_name: user.FIRST_NAME,
      last_name: user.LAST_NAME,
      full_name: `${user.FIRST_NAME || ''} ${user.LAST_NAME || ''}`.trim(),
      user_status: user.USER_STATUS,
      is_email_verified: user.IS_EMAIL_VERIFIED === 'Y',
      failed_login_attempts: user.FAILED_LOGIN_ATTEMPTS,
      is_account_locked: user.IS_ACCOUNT_LOCKED === 'Y',
      account_locked_until: user.ACCOUNT_LOCKED_UNTIL,
      created_date: user.CREATED_DATE,
      last_login_date: user.LAST_LOGIN_DATE,
      last_modified_date: user.LAST_MODIFIED_DATE,
      role: user.ROLE,
      language: user.LANGUAGE
    };
  }
}