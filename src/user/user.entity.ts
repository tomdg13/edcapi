import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
} from 'typeorm';
import { UserStatus } from './user.dto';

@Entity('ED_USER')
export class User {
  @Column({ 
    name: 'USER_ID',
    type: 'number',
    primary: true,
    generated: 'increment'
  })
  userId: number;

  @Column({ name: 'PHONE', length: 50, nullable: false, unique: true })
  phone: string;

  @Column({ name: 'EMAIL', length: 255, nullable: false, unique: true })
  email: string;

  @Column({ name: 'PASSWORD_HASH', length: 255, nullable: false })
  passwordHash: string;

  @Column({ name: 'FIRST_NAME', length: 100, nullable: true })
  firstName: string;

  @Column({ name: 'LAST_NAME', length: 100, nullable: true })
  lastName: string;

  @Column({ 
    name: 'USER_STATUS', 
    type: 'varchar',
    length: 20, 
    default: UserStatus.ACTIVE,
    nullable: false 
  })
  userStatus: UserStatus;

  @CreateDateColumn({ 
    name: 'CREATED_DATE',
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP'
  })
  createdDate: Date;

  @Column({ 
    name: 'LAST_LOGIN_DATE', 
    type: 'timestamp',
    nullable: true 
  })
  lastLoginDate: Date;

  @Column({ 
    name: 'CREATED_BY', 
    length: 50, 
    default: 'SYSTEM',
    nullable: false 
  })
  createdBy: string;

  @Column({ 
    name: 'MODIFIED_BY', 
    length: 50, 
    default: 'SYSTEM',
    nullable: false 
  })
  modifiedBy: string;

  @Column({ name: 'DEVICE_ID', length: 255, nullable: true })
  deviceId: string;

  @Column({ name: 'ROLE_ID', type: 'number', precision: 10, scale: 0, nullable: true })
  roleId: number;

  @Column({ name: 'BRANCH_ID', type: 'number', precision: 10, scale: 0, nullable: true })
  branchId: number;

  @Column({ 
    name: 'USER_CODE', 
    length: 10, 
    nullable: false,
    unique: true 
  })
  userCode: string;

  @BeforeInsert()
  async generateUserCode() {
    // This will be handled in the service layer for better control
    if (!this.userCode) {
      this.userCode = 'TEMP'; // Temporary value, will be updated in service
    }
  }
}