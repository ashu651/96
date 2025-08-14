import { ConfigService as NestConfigService } from '@nestjs/config';
export declare class ConfigService {
    private configService;
    constructor(configService: NestConfigService);
    get databaseUrl(): string;
    get redisUrl(): string;
    get jwtSecret(): string;
    get jwtAccessExpiresIn(): string;
    get jwtRefreshExpiresIn(): string;
    get jwtExpiresIn(): string;
    get jwtRefreshSecret(): string;
    get sendgridApiKey(): string;
    get sendgridFromEmail(): string;
    get frontendUrl(): string;
    get port(): number;
    get nodeEnv(): string;
    get isDevelopment(): boolean;
    get isProduction(): boolean;
    get corsOrigin(): string | string[];
    get rateLimitTtl(): number;
    get rateLimitLimit(): number;
    get bcryptRounds(): number;
    get logLevel(): string;
    get maxFileSize(): number;
    get allowedFileTypes(): string[];
}
