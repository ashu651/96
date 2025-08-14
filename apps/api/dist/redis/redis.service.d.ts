import { OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class RedisService implements OnModuleDestroy {
    private configService;
    private readonly logger;
    private readonly redis;
    constructor(configService: ConfigService);
    set(key: string, value: string, ttl?: number): Promise<void>;
    get(key: string): Promise<string | null>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    expire(key: string, ttl: number): Promise<void>;
    incr(key: string): Promise<number>;
    checkRateLimit(key: string, maxRequests: number, windowSeconds: number): Promise<boolean>;
    setSession(sessionId: string, data: any, ttl: number): Promise<void>;
    getSession(sessionId: string): Promise<any | null>;
    deleteSession(sessionId: string): Promise<void>;
    setCache(key: string, data: any, ttl: number): Promise<void>;
    getCache(key: string): Promise<any | null>;
    invalidateCache(pattern: string): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
