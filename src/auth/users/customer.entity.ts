// src/users/customer.entity.ts
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('kd_customer')
export class Customer {
  @PrimaryGeneratedColumn()
  customer_id: number;

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


