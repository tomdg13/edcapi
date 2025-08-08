import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import * as bodyParser from 'body-parser';
//open token
import { Reflector } from '@nestjs/core'; // Add this import
import { JwtAuthGuard } from './auth/jwt-auth.guard'; // Add this import
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();
  app.enableVersioning({
    type: VersioningType.URI,
  });
  // Serve static files from the 'public' directory
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/public',
  });
  app.useStaticAssets(join(__dirname, '..', 'image'), {
    prefix: '/image/',
  });
  app.use(bodyParser.json({ limit: '30mb' }));
  // Configure CORS
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  //open token
  // Apply global JWT guard
  const reflector = app.get(Reflector);
  const jwtService = app.get(JwtService);
  const configService = app.get(ConfigService);
  app.useGlobalGuards(new JwtAuthGuard(reflector, jwtService, configService));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

    // Add CORS here
  app.enableCors({
    origin: true, // Allow all origins (you can specify specific domains)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true, // Allow cookies/auth headers
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(3030);
}
bootstrap();
