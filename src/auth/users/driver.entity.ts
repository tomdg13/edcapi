// src/users/driver.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('kd_driver')
export class Driver {
  @PrimaryGeneratedColumn()
  driver_id: number;

  @Column()
  username: string;

  @Column()
  email: string;

  @Column({ nullable: true })
  password: string;

  @Column({ nullable: true })
  role: string;

  // add other fields if needed
}


