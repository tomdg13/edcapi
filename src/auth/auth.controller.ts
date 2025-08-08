import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

//open token
import { Public } from './public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }
  //open token
  @Public()
  @Post('login')
  async login(@Body() loginDto: { phone: string; password: string }) {
    // console.log(loginDto);
    try {
      const user = await this.authService.validateUser(
        loginDto.phone,
        loginDto.password,
      );

      if (user == null) {
        throw new UnauthorizedException('User not found');
      }
      if (user == false) {
        throw new UnauthorizedException('Password incorrect');
      }
      const loginResult = await this.authService.login(user);
      // console.log('Login successful, token generated');
      return {
        responseCode: '00',
        message: 'Login successful',
        data: loginResult,
      };
    } catch (error) {
      // console.error('Login error:', error.message);
      throw error;
    }
  }



}
