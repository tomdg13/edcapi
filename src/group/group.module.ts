
// src/group/group.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GroupService } from './group.service';
import { GroupController } from './group.controller';

@Module({
  imports: [
    // If you're using TypeORM entities, add them here
    // TypeOrmModule.forFeature([GroupEntity])
  ],
  controllers: [GroupController],
  providers: [GroupService],
  exports: [GroupService], // Export service for use in other modules
})
export class GroupModule {}