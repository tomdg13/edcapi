import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private jwtService?: JwtService,
    private configService?: ConfigService,
  ) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    // Check for public route metadata (optional - if you want to mark some routes as public)
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Use the parent AuthGuard's canActivate method
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    // Custom error handling
    if (err || !user) {
      // You can customize the error message based on the error type
      if (info && info.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Token expired');
      } else if (info && info.name === 'JsonWebTokenError') {
        throw new UnauthorizedException('Invalid token');
      }

      throw new UnauthorizedException('Unauthorized access');
    }

    return user;
  }
}
