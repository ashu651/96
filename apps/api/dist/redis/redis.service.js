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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.redis = new ioredis_1.default(this.configService.get('REDIS_URL'), {
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
        });
        this.redis.on('connect', () => {
            this.logger.log('Connected to Redis');
        });
        this.redis.on('error', (error) => {
            this.logger.error('Redis connection error:', error);
        });
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.redis.setex(key, ttl, value);
            }
            else {
                await this.redis.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Failed to set key ${key}:`, error);
            throw error;
        }
    }
    async get(key) {
        try {
            return await this.redis.get(key);
        }
        catch (error) {
            this.logger.error(`Failed to get key ${key}:`, error);
            throw error;
        }
    }
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Failed to delete key ${key}:`, error);
            throw error;
        }
    }
    async exists(key) {
        try {
            const result = await this.redis.exists(key);
            return result === 1;
        }
        catch (error) {
            this.logger.error(`Failed to check existence of key ${key}:`, error);
            throw error;
        }
    }
    async expire(key, ttl) {
        try {
            await this.redis.expire(key, ttl);
        }
        catch (error) {
            this.logger.error(`Failed to set expiration for key ${key}:`, error);
            throw error;
        }
    }
    async incr(key) {
        try {
            return await this.redis.incr(key);
        }
        catch (error) {
            this.logger.error(`Failed to increment key ${key}:`, error);
            throw error;
        }
    }
    async checkRateLimit(key, maxRequests, windowSeconds) {
        try {
            const current = await this.redis.get(key);
            const currentCount = current ? parseInt(current, 10) : 0;
            if (currentCount >= maxRequests) {
                return false;
            }
            await this.redis.multi()
                .incr(key)
                .expire(key, windowSeconds)
                .exec();
            return true;
        }
        catch (error) {
            this.logger.error(`Failed to check rate limit for key ${key}:`, error);
            return true;
        }
    }
    async setSession(sessionId, data, ttl) {
        try {
            await this.redis.setex(sessionId, ttl, JSON.stringify(data));
        }
        catch (error) {
            this.logger.error(`Failed to set session ${sessionId}:`, error);
            throw error;
        }
    }
    async getSession(sessionId) {
        try {
            const data = await this.redis.get(sessionId);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            this.logger.error(`Failed to get session ${sessionId}:`, error);
            throw error;
        }
    }
    async deleteSession(sessionId) {
        try {
            await this.redis.del(sessionId);
        }
        catch (error) {
            this.logger.error(`Failed to delete session ${sessionId}:`, error);
            throw error;
        }
    }
    async setCache(key, data, ttl) {
        try {
            await this.redis.setex(key, ttl, JSON.stringify(data));
        }
        catch (error) {
            this.logger.error(`Failed to set cache for key ${key}:`, error);
            throw error;
        }
    }
    async getCache(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            this.logger.error(`Failed to get cache for key ${key}:`, error);
            throw error;
        }
    }
    async invalidateCache(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            this.logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
            throw error;
        }
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map