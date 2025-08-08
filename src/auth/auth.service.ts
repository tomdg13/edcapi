import {
  Injectable,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UnauthorizedException } from '@nestjs/common';
import { User } from './users/users.entity';
import { Customer } from './users/customer.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly dataSource: DataSource 
  ) { }



  async validateUser(phone: string, password: string): Promise<any> {
    const connection = this.usersRepository.manager.connection;
    const sql = `SELECT user_id, phone, email,PASSWORD_HASH,USER_STATUS FROM ed_user WHERE phone = '${phone}'`;

    try {
      const result = await connection.query(sql);
      const user = result[0];

      if (!user || !user.PASSWORD_HASH) {
        throw new UnauthorizedException('Invalid phone or password');
      }

      // 🔐 MD5 hash input password
      const md5 = (input: string) => crypto.createHash('md5').update(input).digest('hex');
      const hashedPassword = md5(password);

      // 🔑 Check password
      if (user.PASSWORD_HASH !== hashedPassword) {
        throw new UnauthorizedException('Invalid phone or password');
      }

      // 📛 Check account status
      switch (user.USER_STATUS) {
        case 'ACTIVE':
          break; // ok
        case 'reset':
          throw new UnauthorizedException('Reset password required');
        case 'close':
          throw new UnauthorizedException('User is closed');
        default:
          throw new UnauthorizedException('User is not active');
      }

      // ✅ Return user without password
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;

    } catch (error) {
      console.error('validateUser error:', error);
      throw error;
    }
  }




  async login(user: any) {
    const payload = { phone: user.PHONE,language: user.USER_STATUS, role: user.role, sub: user.USER_ID, name: user.name };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '10h' });
    return {
      access_token: accessToken,
    };
  }

  async Clogin(user: any) {
    const payload = { phone: user.phone,language: user.language, role: user.role, sub: user.user_id, name: user.name };
    const accessCToken = this.jwtService.sign(payload, { expiresIn: '10h' });
    return {
      access_token: accessCToken,
    };
  }


  async Dlogin(user: any) {
    const payload = { phone: user.phone,language: user.language, role: user.role, sub: user.user_id, name: user.name };
    const accessDToken = this.jwtService.sign(payload, { expiresIn: '10h' });
    return {
      access_token: accessDToken,
    };
  }

}
