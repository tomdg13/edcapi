// src/user/user.module.ts - COMPLETE USER MODULE FOR ED_USER SYSTEM
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';

@Module({
  imports: [
  ],
  controllers: [UserController],
  providers: [UserService],
  exports: [
    UserService, 
  ],
})
export class UserModule {}

