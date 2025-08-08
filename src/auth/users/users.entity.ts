import { Entity, Column, } from 'typeorm';

@Entity('kd_user')
export class User {
  @Column()
  userName: string;

  @Column()
  password: string;
}