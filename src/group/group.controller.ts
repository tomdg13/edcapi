// src/group/group.controller.ts - COMPLETE GROUP CONTROLLER FOR ED_GROUP
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
import { GroupService } from './group.service';

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
  Matches,
  IsDateString,
  IsBoolean
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

// DTO Classes for validation
class CreateGroupDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  staff_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]{8,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  registration_business?: string;

  @IsOptional()
  @IsDateString()
  opendate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  group_id?: number;
}

class UpdateGroupDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  staff_name?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  @Matches(/^\+?[\d\s\-\(\)]{8,20}$/, { message: 'Invalid phone number format' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsDateString()
  birthday?: Date;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  registration_business?: string;

  @IsOptional()
  @IsDateString()
  opendate?: Date;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  group_id?: number;
}

class GroupQueryDto {
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
  @IsString()
  @MaxLength(100)
  search?: string;

  @IsOptional()
  @IsIn(['ID', 'NAME', 'STAFF_NAME', 'EMAIL', 'PHONE', 'TITLE', 'BIRTHDAY', 'OPENDATE', 'GROUP_ID'])
  sortBy?: string;

  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  group_id?: number;

  @IsOptional()
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  has_staff?: boolean;
}

class DateRangeDto {
  @IsNotEmpty()
  @IsDateString()
  start_date: Date;

  @IsNotEmpty()
  @IsDateString()
  end_date: Date;
}

class BirthdayQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  days?: number = 30;
}

class BulkActionDto {
  @IsNotEmpty()
  @IsNumber({}, { each: true })
  group_ids: number[];

  @IsNotEmpty()
  @IsIn(['delete', 'update_group_id', 'clear_staff'])
  action: 'delete' | 'update_group_id' | 'clear_staff';

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  new_group_id?: number;
}

@Controller('groups')
export class GroupController {
  constructor(private readonly groupService: GroupService) {}

  // GET /groups - Get all groups with filtering and pagination
  @Get()
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findAll(@Query() query: GroupQueryDto) {
    try {
      return await this.groupService.findAll(query);
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/stats - Get group statistics
  @Get('stats')
  @HttpCode(HttpStatus.OK)
  async getStats() {
    try {
      return await this.groupService.getStats();
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/search/:identifier - Find group by email or phone
  @Get('search/:identifier')
  @HttpCode(HttpStatus.OK)
  async findByIdentifier(@Param('identifier') identifier: string) {
    try {
      return await this.groupService.findByEmailOrPhone(identifier);
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/by-group-id/:groupId - Get groups by group_id
  @Get('by-group-id/:groupId')
  @HttpCode(HttpStatus.OK)
  async findByGroupId(@Param('groupId', ParseIntPipe) groupId: number) {
    try {
      return await this.groupService.findByGroupId(groupId);
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/with-staff - Get groups that have staff assigned
  @Get('with-staff')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findWithStaff(@Query() query: Omit<GroupQueryDto, 'has_staff'>) {
    try {
      return await this.groupService.findAll({ ...query, has_staff: true });
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/without-staff - Get groups without staff
  @Get('without-staff')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async findWithoutStaff(@Query() query: Omit<GroupQueryDto, 'has_staff'>) {
    try {
      return await this.groupService.findAll({ ...query, has_staff: false });
    } catch (error) {
      throw error;
    }
  }

  // POST /groups/date-range - Get groups by date range
  @Post('date-range')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async findByDateRange(@Body() dateRangeDto: DateRangeDto) {
    try {
      return await this.groupService.findByDateRange(
        dateRangeDto.start_date, 
        dateRangeDto.end_date
      );
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/upcoming-birthdays - Get upcoming birthdays
  @Get('upcoming-birthdays')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async getUpcomingBirthdays(@Query() query: BirthdayQueryDto) {
    try {
      return await this.groupService.getUpcomingBirthdays(query.days);
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/:id - Get group by ID
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.groupService.findOne(id);
    } catch (error) {
      throw error;
    }
  }

  // POST /groups - Create new group
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe())
  async create(@Body() createGroupDto: CreateGroupDto) {
    try {
      return await this.groupService.create(createGroupDto);
    } catch (error) {
      throw error;
    }
  }

  // POST /groups/bulk-action - Bulk operations on multiple groups
  @Post('bulk-action')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async bulkAction(@Body() bulkActionDto: BulkActionDto) {
    try {
      const results = [];
      
      for (const groupId of bulkActionDto.group_ids) {
        try {
          let result;
          switch (bulkActionDto.action) {
            case 'delete':
              result = await this.groupService.delete(groupId);
              break;
            case 'update_group_id':
              if (!bulkActionDto.new_group_id) {
                throw new Error('new_group_id is required for update_group_id action');
              }
              result = await this.groupService.update(groupId, { 
                group_id: bulkActionDto.new_group_id 
              });
              break;
            case 'clear_staff':
              result = await this.groupService.update(groupId, { 
                staff_name: null,
                title: null
              });
              break;
            default:
              throw new Error('Invalid action');
          }
          
          results.push({
            group_id: groupId,
            status: 'success',
            result: result
          });
        } catch (error) {
          results.push({
            group_id: groupId,
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
            total: bulkActionDto.group_ids.length,
            successful: results.filter(r => r.status === 'success').length,
            failed: results.filter(r => r.status === 'error').length
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // PATCH /groups/:id - Update group
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGroupDto: UpdateGroupDto,
  ) {
    try {
      return await this.groupService.update(id, updateGroupDto);
    } catch (error) {
      throw error;
    }
  }

  // PATCH /groups/:id/assign-staff - Assign staff to group
  @Patch(':id/assign-staff')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async assignStaff(
    @Param('id', ParseIntPipe) id: number,
    @Body() staffDto: { staff_name: string; title?: string },
  ) {
    try {
      return await this.groupService.update(id, {
        staff_name: staffDto.staff_name,
        title: staffDto.title
      });
    } catch (error) {
      throw error;
    }
  }

  // PATCH /groups/:id/remove-staff - Remove staff from group
  @Patch(':id/remove-staff')
  @HttpCode(HttpStatus.OK)
  async removeStaff(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.groupService.update(id, {
        staff_name: null,
        title: null
      });
    } catch (error) {
      throw error;
    }
  }

  // PATCH /groups/:id/update-contact - Update contact information
  @Patch(':id/update-contact')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async updateContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() contactDto: { email?: string; phone?: string },
  ) {
    try {
      return await this.groupService.update(id, contactDto);
    } catch (error) {
      throw error;
    }
  }

  // PATCH /groups/:id/update-group-id - Update group_id
  @Patch(':id/update-group-id')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe())
  async updateGroupId(
    @Param('id', ParseIntPipe) id: number,
    @Body() groupIdDto: { group_id: number },
  ) {
    try {
      return await this.groupService.update(id, { group_id: groupIdDto.group_id });
    } catch (error) {
      throw error;
    }
  }

  // DELETE /groups/:id - Delete group
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id', ParseIntPipe) id: number) {
    try {
      return await this.groupService.delete(id);
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/:id/profile - Get group profile information
  @Get(':id/profile')
  @HttpCode(HttpStatus.OK)
  async getGroupProfile(@Param('id', ParseIntPipe) id: number) {
    try {
      const groupResult = await this.groupService.findOne(id);
      
      // Return enhanced profile information
      const group = groupResult.data;
      return {
        status: 'success',
        message: 'Group profile retrieved successfully',
        data: {
          id: group.id,
          name: group.name,
          staff_name: group.staff_name,
          email: group.email,
          phone: group.phone,
          title: group.title,
          birthday: group.birthday,
          age: group.age,
          registration_business: group.registration_business,
          opendate: group.opendate,
          group_id: group.group_id,
          has_staff: group.has_staff,
          has_contact: group.has_contact
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/:id/related - Get related groups (same group_id)
  @Get(':id/related')
  @HttpCode(HttpStatus.OK)
  async getRelatedGroups(@Param('id', ParseIntPipe) id: number) {
    try {
      const groupResult = await this.groupService.findOne(id);
      const group = groupResult.data;
      
      if (!group.group_id) {
        return {
          status: 'success',
          message: 'No related groups found',
          data: [],
          count: 0
        };
      }

      const relatedGroups = await this.groupService.findByGroupId(group.group_id);
      
      // Filter out the current group
      const filteredGroups = relatedGroups.data.filter(g => g.id !== id);
      
      return {
        status: 'success',
        message: 'Related groups retrieved successfully',
        data: filteredGroups,
        count: filteredGroups.length,
        group_id: group.group_id
      };
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/:id/staff-info - Get staff information for group
  @Get(':id/staff-info')
  @HttpCode(HttpStatus.OK)
  async getStaffInfo(@Param('id', ParseIntPipe) id: number) {
    try {
      const groupResult = await this.groupService.findOne(id);
      const group = groupResult.data;
      
      return {
        status: 'success',
        message: 'Staff information retrieved successfully',
        data: {
          group_id: id,
          name: group.name,
          staff_name: group.staff_name,
          title: group.title,
          email: group.email,
          phone: group.phone,
          has_staff: group.has_staff
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // POST /groups/export - Export groups data information
  @Post('export')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async exportGroups(
    @Body() exportDto: { 
      format?: 'csv' | 'excel' | 'json'; 
      filters?: GroupQueryDto 
    }
  ) {
    try {
      const groups = await this.groupService.findAll(exportDto.filters || {});
      
      return {
        status: 'success',
        message: 'Export data prepared successfully',
        data: {
          format: exportDto.format || 'json',
          total_records: groups.data.length,
          groups: groups.data,
          pagination: groups.pagination,
          // In real implementation, you'd generate the actual file
          export_info: {
            generated_at: new Date().toISOString(),
            total_groups: groups.data.length,
            format: exportDto.format || 'json'
          }
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // GET /groups/summary/by-group-id - Get summary statistics by group_id
  @Get('summary/by-group-id')
  @HttpCode(HttpStatus.OK)
  async getSummaryByGroupId() {
    try {
      // This would require a custom query in the service
      const query = `
        SELECT 
          GROUP_ID,
          COUNT(*) as total_records,
          COUNT(STAFF_NAME) as records_with_staff,
          COUNT(EMAIL) as records_with_email,
          COUNT(PHONE) as records_with_phone,
          MIN(OPENDATE) as earliest_opendate,
          MAX(OPENDATE) as latest_opendate
        FROM ED_GROUP 
        WHERE GROUP_ID IS NOT NULL
        GROUP BY GROUP_ID
        ORDER BY GROUP_ID
      `;

      // Note: This would need to be implemented in the service
      // For now, return a placeholder response
      return {
        status: 'success',
        message: 'Group summary by group_id retrieved successfully',
        data: {
          note: 'This endpoint would require custom implementation in the service layer',
          suggested_implementation: 'Add a getSummaryByGroupId method to GroupService'
        }
      };
    } catch (error) {
      throw error;
    }
  }
}