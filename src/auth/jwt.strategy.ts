import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users/users.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('JWT_SECRET') || 'your-super-secret-key',
    });
  }
 async validate(payload: any) {
  const connection = this.usersRepository.manager.connection;
  const phone = payload.phone;

  const tables = ['ed_user'];

  try {
    for (const table of tables) {
      const query = `SELECT * FROM ${table} WHERE phone = '${phone}'`;
      // console.log(query)
      const result = await connection.query(query);
    //  console.log(result);
      if (result.length > 0) {
        const user = result[0];
        const { password, ...userResult } = user;
        return { ...userResult, roleTable: table }; // Optional: include which table the user was found in
      }
    }

    throw new UnauthorizedException('User not found in any table');
  } catch (error) {
    throw new UnauthorizedException('Error validating token');
  }
}

}
