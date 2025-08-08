// src/group/group.service.ts - COMPLETE GROUP SERVICE FOR ED_GROUP
import { 
  Injectable, 
  HttpException, 
  HttpStatus,
  NotFoundException,
  BadRequestException,
  ConflictException 
} from '@nestjs/common';
import { DataSource } from 'typeorm';

// Interfaces for type safety
interface GroupQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
  group_id?: number;
  has_staff?: boolean;
}

interface CreateGroupData {
  name: string;
  staff_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  birthday?: Date;
  registration_business?: string;
  opendate?: Date;
  group_id?: number;
}

interface UpdateGroupData {
  name?: string;
  staff_name?: string;
  email?: string;
  phone?: string;
  title?: string;
  birthday?: Date;
  registration_business?: string;
  opendate?: Date;
  group_id?: number;
}

@Injectable()
export class GroupService {
  constructor(private dataSource: DataSource) {}

  // Get all groups with enhanced filtering, pagination, and error handling
  async findAll(queryParams: GroupQueryParams = {}): Promise<any> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'OPENDATE',
        sortOrder = 'DESC',
        group_id,
        has_staff
      } = queryParams;

      // Validate pagination parameters
      if (page < 1 || limit < 1 || limit > 100) {
        throw new BadRequestException('Invalid pagination parameters');
      }

      const offset = (page - 1) * limit;
      let whereClause = 'WHERE 1=1';
      const params: any = {};

      // Build dynamic WHERE clause
      if (search) {
        whereClause += ` AND (
          UPPER(NAME) LIKE UPPER(:search) OR 
          UPPER(STAFF_NAME) LIKE UPPER(:search) OR 
          UPPER(EMAIL) LIKE UPPER(:search) OR 
          UPPER(PHONE) LIKE UPPER(:search) OR
          UPPER(TITLE) LIKE UPPER(:search) OR
          UPPER(REGISTRATION_BUSINESS) LIKE UPPER(:search)
        )`;
        params.search = `%${search}%`;
      }

      if (group_id) {
        whereClause += ' AND GROUP_ID = :groupId';
        params.groupId = group_id;
      }

      if (has_staff !== undefined) {
        if (has_staff) {
          whereClause += ' AND STAFF_NAME IS NOT NULL';
        } else {
          whereClause += ' AND STAFF_NAME IS NULL';
        }
      }

      // Get total count for pagination
      const countQuery = `SELECT COUNT(*) as total FROM ED_GROUP ${whereClause}`;
      const countResult = await this.dataSource.query(countQuery, Object.values(params));
      const total = parseInt(countResult[0]?.total || '0');

      // Main query with pagination
      const query = `
        SELECT 
          ID,
          NAME,
          STAFF_NAME,
          EMAIL,
          PHONE,
          TITLE,
          BIRTHDAY,
          REGISTRATION_BUSINESS,
          OPENDATE,
          GROUP_ID
        FROM ED_GROUP 
        ${whereClause}
        ORDER BY ${sortBy} ${sortOrder}
        OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY
      `;

      const groups = await this.dataSource.query(query, Object.values(params));

      // Format response data
      const formattedGroups = groups.map(group => this.formatGroupResponse(group));

      return {
        status: 'success',
        message: 'Groups retrieved successfully',
        data: formattedGroups,
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
      console.error('Error fetching groups:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch groups',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get group by ID
  async findOne(id: number): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid group ID provided');
      }

      const query = `
        SELECT 
          ID, NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        FROM ED_GROUP 
        WHERE ID = :id
      `;

      const result = await this.dataSource.query(query, [id]);
      const group = result[0];

      if (!group) {
        throw new NotFoundException(`Group with ID ${id} not found`);
      }

      return {
        status: 'success',
        message: 'Group retrieved successfully',
        data: this.formatGroupResponse(group)
      };

    } catch (error) {
      console.error('Error fetching group:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch group',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get groups by group_id
  async findByGroupId(groupId: number): Promise<any> {
    try {
      if (!groupId || isNaN(groupId)) {
        throw new BadRequestException('Invalid group ID provided');
      }

      const query = `
        SELECT 
          ID, NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        FROM ED_GROUP 
        WHERE GROUP_ID = :groupId
        ORDER BY OPENDATE DESC
      `;

      const result = await this.dataSource.query(query, [groupId]);

      const formattedGroups = result.map(group => this.formatGroupResponse(group));

      return {
        status: 'success',
        message: 'Groups retrieved successfully',
        data: formattedGroups,
        count: result.length
      };

    } catch (error) {
      console.error('Error fetching groups by group ID:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch groups',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Find group by email or phone
  async findByEmailOrPhone(identifier: string): Promise<any> {
    try {
      if (!identifier) {
        throw new BadRequestException('Email or phone is required');
      }

      const query = `
        SELECT 
          ID, NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        FROM ED_GROUP 
        WHERE EMAIL = :identifier OR PHONE = :identifier
      `;

      const result = await this.dataSource.query(query, [identifier]);
      
      const formattedGroups = result.map(group => this.formatGroupResponse(group));

      return {
        status: 'success',
        message: 'Groups retrieved successfully',
        data: formattedGroups,
        count: result.length
      };

    } catch (error) {
      console.error('Error fetching group by identifier:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch group',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Create new group
  async create(groupData: CreateGroupData): Promise<any> {
    try {
      // Validate required fields
      if (!groupData.name) {
        throw new BadRequestException('Group name is required');
      }

      // Validate email format if provided
      if (groupData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(groupData.email)) {
          throw new BadRequestException('Invalid email format');
        }
      }

      // Validate phone format if provided
      if (groupData.phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
        if (!phoneRegex.test(groupData.phone)) {
          throw new BadRequestException('Invalid phone number format');
        }
      }

      // Check if name already exists (optional business rule)
      const existsQuery = `
        SELECT ID FROM ED_GROUP 
        WHERE UPPER(NAME) = UPPER(:name)
      `;
      
      const existingGroup = await this.dataSource.query(existsQuery, [groupData.name]);

      if (existingGroup.length > 0) {
        throw new ConflictException('Group name already exists');
      }

      // Set default opendate to current date if not provided
      const opendate = groupData.opendate || new Date();

      // Insert new group
      const insertQuery = `
        INSERT INTO ED_GROUP (
          NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        ) VALUES (
          :name, :staffName, :email, :phone, :title,
          :birthday, :registrationBusiness, :opendate, :groupId
        )
      `;

      const result = await this.dataSource.query(insertQuery, [
        groupData.name,
        groupData.staff_name || null,
        groupData.email || null,
        groupData.phone || null,
        groupData.title || null,
        groupData.birthday || null,
        groupData.registration_business || null,
        opendate,
        groupData.group_id || null
      ]);

      return {
        status: 'success',
        message: 'Group created successfully',
        data: {
          id: result.insertId,
          name: groupData.name,
          staff_name: groupData.staff_name,
          email: groupData.email,
          phone: groupData.phone,
          title: groupData.title,
          opendate: opendate
        }
      };

    } catch (error) {
      console.error('Error creating group:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to create group',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Update group
  async update(id: number, updateData: UpdateGroupData): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid group ID provided');
      }

      // Check if group exists
      await this.findOne(id);

      // Validate email format if provided
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          throw new BadRequestException('Invalid email format');
        }
      }

      // Validate phone format if provided
      if (updateData.phone) {
        const phoneRegex = /^\+?[\d\s\-\(\)]{8,20}$/;
        if (!phoneRegex.test(updateData.phone)) {
          throw new BadRequestException('Invalid phone number format');
        }
      }

      // Check for name conflicts if updating name
      if (updateData.name) {
        const conflictQuery = `
          SELECT ID FROM ED_GROUP 
          WHERE UPPER(NAME) = UPPER(:name) AND ID != :id
        `;
        
        const conflicts = await this.dataSource.query(conflictQuery, [updateData.name, id]);

        if (conflicts.length > 0) {
          throw new ConflictException('Group name already exists');
        }
      }

      // Build dynamic update query
      const updateFields: string[] = [];
      const params: any[] = [];

      if (updateData.name !== undefined) {
        updateFields.push('NAME = ?');
        params.push(updateData.name);
      }
      if (updateData.staff_name !== undefined) {
        updateFields.push('STAFF_NAME = ?');
        params.push(updateData.staff_name);
      }
      if (updateData.email !== undefined) {
        updateFields.push('EMAIL = ?');
        params.push(updateData.email);
      }
      if (updateData.phone !== undefined) {
        updateFields.push('PHONE = ?');
        params.push(updateData.phone);
      }
      if (updateData.title !== undefined) {
        updateFields.push('TITLE = ?');
        params.push(updateData.title);
      }
      if (updateData.birthday !== undefined) {
        updateFields.push('BIRTHDAY = ?');
        params.push(updateData.birthday);
      }
      if (updateData.registration_business !== undefined) {
        updateFields.push('REGISTRATION_BUSINESS = ?');
        params.push(updateData.registration_business);
      }
      if (updateData.opendate !== undefined) {
        updateFields.push('OPENDATE = ?');
        params.push(updateData.opendate);
      }
      if (updateData.group_id !== undefined) {
        updateFields.push('GROUP_ID = ?');
        params.push(updateData.group_id);
      }

      if (updateFields.length === 0) {
        throw new BadRequestException('No fields to update');
      }

      params.push(id);

      const updateQuery = `
        UPDATE ED_GROUP 
        SET ${updateFields.join(', ')}
        WHERE ID = ?
      `;

      await this.dataSource.query(updateQuery, params);

      // Return updated group
      const updatedGroup = await this.findOne(id);
      return {
        status: 'success',
        message: 'Group updated successfully',
        data: updatedGroup.data
      };

    } catch (error) {
      console.error('Error updating group:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to update group',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Delete group
  async delete(id: number): Promise<any> {
    try {
      if (!id || isNaN(id)) {
        throw new BadRequestException('Invalid group ID provided');
      }

      // Check if group exists
      await this.findOne(id);

      const deleteQuery = `DELETE FROM ED_GROUP WHERE ID = ?`;
      await this.dataSource.query(deleteQuery, [id]);

      return {
        status: 'success',
        message: 'Group deleted successfully',
        data: { id: id }
      };

    } catch (error) {
      console.error('Error deleting group:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to delete group',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get group statistics
  async getStats(): Promise<any> {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_groups,
          COUNT(STAFF_NAME) as groups_with_staff,
          COUNT(*) - COUNT(STAFF_NAME) as groups_without_staff,
          COUNT(EMAIL) as groups_with_email,
          COUNT(PHONE) as groups_with_phone,
          COUNT(BIRTHDAY) as groups_with_birthday,
          COUNT(REGISTRATION_BUSINESS) as groups_with_business_registration,
          COUNT(DISTINCT GROUP_ID) as unique_group_ids,
          COUNT(CASE WHEN OPENDATE >= SYSDATE - 30 THEN 1 END) as created_last_30_days,
          COUNT(CASE WHEN OPENDATE >= SYSDATE - 365 THEN 1 END) as created_last_year
        FROM ED_GROUP
      `;

      const result = await this.dataSource.query(query);

      return {
        status: 'success',
        message: 'Group statistics retrieved successfully',
        data: result[0]
      };

    } catch (error) {
      console.error('Error fetching group statistics:', error.message);

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch group statistics',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get groups by date range
  async findByDateRange(startDate: Date, endDate: Date): Promise<any> {
    try {
      if (!startDate || !endDate) {
        throw new BadRequestException('Start date and end date are required');
      }

      if (startDate > endDate) {
        throw new BadRequestException('Start date cannot be after end date');
      }

      const query = `
        SELECT 
          ID, NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        FROM ED_GROUP 
        WHERE OPENDATE >= :startDate AND OPENDATE <= :endDate
        ORDER BY OPENDATE DESC
      `;

      const result = await this.dataSource.query(query, [startDate, endDate]);
      const formattedGroups = result.map(group => this.formatGroupResponse(group));

      return {
        status: 'success',
        message: 'Groups retrieved successfully',
        data: formattedGroups,
        count: result.length,
        dateRange: {
          startDate,
          endDate
        }
      };

    } catch (error) {
      console.error('Error fetching groups by date range:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch groups by date range',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Get upcoming birthdays
  async getUpcomingBirthdays(days: number = 30): Promise<any> {
    try {
      if (days < 1 || days > 365) {
        throw new BadRequestException('Days must be between 1 and 365');
      }

      const query = `
        SELECT 
          ID, NAME, STAFF_NAME, EMAIL, PHONE, TITLE,
          BIRTHDAY, REGISTRATION_BUSINESS, OPENDATE, GROUP_ID
        FROM ED_GROUP 
        WHERE BIRTHDAY IS NOT NULL 
          AND TO_CHAR(BIRTHDAY, 'MM-DD') BETWEEN 
              TO_CHAR(SYSDATE, 'MM-DD') AND 
              TO_CHAR(SYSDATE + :days, 'MM-DD')
        ORDER BY TO_CHAR(BIRTHDAY, 'MM-DD')
      `;

      const result = await this.dataSource.query(query, [days]);
      const formattedGroups = result.map(group => this.formatGroupResponse(group));

      return {
        status: 'success',
        message: 'Upcoming birthdays retrieved successfully',
        data: formattedGroups,
        count: result.length,
        daysRange: days
      };

    } catch (error) {
      console.error('Error fetching upcoming birthdays:', error.message);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException({
        status: 'error',
        message: 'Failed to fetch upcoming birthdays',
        error: error.message,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // Private helper method to format group response
  private formatGroupResponse(group: any) {
    return {
      id: group.ID,
      name: group.NAME,
      staff_name: group.STAFF_NAME,
      email: group.EMAIL,
      phone: group.PHONE,
      title: group.TITLE,
      birthday: group.BIRTHDAY,
      registration_business: group.REGISTRATION_BUSINESS,
      opendate: group.OPENDATE,
      group_id: group.GROUP_ID,
      has_staff: !!group.STAFF_NAME,
      has_contact: !!(group.EMAIL || group.PHONE),
      age: group.BIRTHDAY ? this.calculateAge(group.BIRTHDAY) : null
    };
  }

  // Helper method to calculate age from birthday
  private calculateAge(birthday: Date): number | null {
    if (!birthday) return null;
    
    const today = new Date();
    const birthDate = new Date(birthday);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}