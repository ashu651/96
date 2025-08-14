import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // Database
  get databaseUrl(): string {
    return this.configService.get<string>('DATABASE_URL');
  }

  // Redis
  get redisUrl(): string {
    return this.configService.get<string>('REDIS_URL');
  }

  // JWT
  get jwtSecret(): string {
    return this.configService.get<string>('JWT_SECRET');
  }

  get jwtAccessExpiresIn(): string {
    return this.configService.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
  }

  get jwtRefreshExpiresIn(): string {
    return this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d');
  }

  get jwtExpiresIn(): string {
    return this.configService.get<string>('JWT_EXPIRES_IN', '15m');
  }

  get jwtRefreshSecret(): string {
    return this.configService.get<string>('JWT_REFRESH_SECRET', this.jwtSecret);
  }

  // Email
  get sendgridApiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY');
  }

  get sendgridFromEmail(): string {
    return this.configService.get<string>('SENDGRID_FROM_EMAIL');
  }

  get frontendUrl(): string {
    return this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
  }

  // Server
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  get nodeEnv(): string {
    return this.configService.get<string>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  // CORS
  get corsOrigin(): string | string[] {
    const origin = this.configService.get<string>('CORS_ORIGIN');
    if (origin) {
      return origin.split(',').map(o => o.trim());
    }
    return this.isDevelopment ? ['http://localhost:3000', 'http://localhost:3001'] : [];
  }

  // Rate Limiting
  get rateLimitTtl(): number {
    return this.configService.get<number>('RATE_LIMIT_TTL', 60);
  }

  get rateLimitLimit(): number {
    return this.configService.get<number>('RATE_LIMIT_LIMIT', 100);
  }

  // Security
  get bcryptRounds(): number {
    return this.configService.get<number>('BCRYPT_ROUNDS', 12);
  }

  // Logging
  get logLevel(): string {
    return this.configService.get<string>('LOG_LEVEL', 'info');
  }

  // File Upload
  get maxFileSize(): number {
    return this.configService.get<number>('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
  }

  get allowedFileTypes(): string[] {
    const types = this.configService.get<string>('ALLOWED_FILE_TYPES');
    return types ? types.split(',').map(t => t.trim()) : ['image/jpeg', 'image/png', 'image/gif'];
  }
}