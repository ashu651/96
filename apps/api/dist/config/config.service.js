"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let ConfigService = class ConfigService {
    constructor(configService) {
        this.configService = configService;
    }
    get databaseUrl() {
        return this.configService.get('DATABASE_URL');
    }
    get redisUrl() {
        return this.configService.get('REDIS_URL');
    }
    get jwtSecret() {
        return this.configService.get('JWT_SECRET');
    }
    get jwtAccessExpiresIn() {
        return this.configService.get('JWT_ACCESS_EXPIRES_IN', '15m');
    }
    get jwtRefreshExpiresIn() {
        return this.configService.get('JWT_REFRESH_EXPIRES_IN', '7d');
    }
    get jwtExpiresIn() {
        return this.configService.get('JWT_EXPIRES_IN', '15m');
    }
    get jwtRefreshSecret() {
        return this.configService.get('JWT_REFRESH_SECRET', this.jwtSecret);
    }
    get sendgridApiKey() {
        return this.configService.get('SENDGRID_API_KEY');
    }
    get sendgridFromEmail() {
        return this.configService.get('SENDGRID_FROM_EMAIL');
    }
    get frontendUrl() {
        return this.configService.get('FRONTEND_URL', 'http://localhost:3000');
    }
    get port() {
        return this.configService.get('PORT', 3000);
    }
    get nodeEnv() {
        return this.configService.get('NODE_ENV', 'development');
    }
    get isDevelopment() {
        return this.nodeEnv === 'development';
    }
    get isProduction() {
        return this.nodeEnv === 'production';
    }
    get corsOrigin() {
        const origin = this.configService.get('CORS_ORIGIN');
        if (origin) {
            return origin.split(',').map(o => o.trim());
        }
        return this.isDevelopment ? ['http://localhost:3000', 'http://localhost:3001'] : [];
    }
    get rateLimitTtl() {
        return this.configService.get('RATE_LIMIT_TTL', 60);
    }
    get rateLimitLimit() {
        return this.configService.get('RATE_LIMIT_LIMIT', 100);
    }
    get bcryptRounds() {
        return this.configService.get('BCRYPT_ROUNDS', 12);
    }
    get logLevel() {
        return this.configService.get('LOG_LEVEL', 'info');
    }
    get maxFileSize() {
        return this.configService.get('MAX_FILE_SIZE', 5 * 1024 * 1024);
    }
    get allowedFileTypes() {
        const types = this.configService.get('ALLOWED_FILE_TYPES');
        return types ? types.split(',').map(t => t.trim()) : ['image/jpeg', 'image/png', 'image/gif'];
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ConfigService);
//# sourceMappingURL=config.service.js.map