// open token
import { MiddlewareConsumer, Module } from '@nestjs/common';
// import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { UserAuthModule } from './auth/auth.module';
// open token
import { JwtMiddleware } from './auth/middleware/jwt.middleware';
import { UserModule } from './user/user.module';
import { GroupModule } from './group/group.module';
// Add this import for the User entity
import { User } from './user/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'oracle',
      poolSize: 1,
      username: 'atmbk',
      password: 'atmbk12123',
      connectString: '10.154.46.26:1521/ATMRPT',
      synchronize: false, // Set to false in production
      entities: [User], // Add User entity here
    }),
    ScheduleModule.forRoot(),
    UserAuthModule,
    UserModule,
    GroupModule
  ],
  controllers: [],
})
export class AppModule {
  constructor(private readonly connection: DataSource) { }
  // open token
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(JwtMiddleware).forRoutes('*'); // Apply to all routes
  }
}