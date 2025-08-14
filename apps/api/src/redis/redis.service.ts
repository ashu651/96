import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;

  constructor(private configService: ConfigService) {
    this.redis = new Redis(this.configService.get('REDIS_URL'), {
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

  /**
   * Set a key-value pair with optional expiration
   * @param key - Redis key
   * @param value - Value to store
   * @param ttl - Time to live in seconds
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.setex(key, ttl, value);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Failed to set key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get a value by key
   * @param key - Redis key
   * @returns Value or null if not found
   */
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error(`Failed to get key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Delete a key
   * @param key - Redis key
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Failed to delete key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if a key exists
   * @param key - Redis key
   * @returns True if key exists
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence of key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set key expiration
   * @param key - Redis key
   * @param ttl - Time to live in seconds
   */
  async expire(key: string, ttl: number): Promise<void> {
    try {
      await this.redis.expire(key, ttl);
    } catch (error) {
      this.logger.error(`Failed to set expiration for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Increment a counter
   * @param key - Redis key
   * @returns New value
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      this.logger.error(`Failed to increment key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Set rate limit for a key
   * @param key - Rate limit key
   * @param maxRequests - Maximum requests allowed
   * @param windowSeconds - Time window in seconds
   * @returns True if request is allowed
   */
  async checkRateLimit(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): Promise<boolean> {
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
    } catch (error) {
      this.logger.error(`Failed to check rate limit for key ${key}:`, error);
      // Allow request on error to prevent blocking users
      return true;
    }
  }

  /**
   * Store user session data
   * @param sessionId - Session identifier
   * @param data - Session data
   * @param ttl - Time to live in seconds
   */
  async setSession(sessionId: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(sessionId, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Failed to set session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Get user session data
   * @param sessionId - Session identifier
   * @returns Session data or null if not found
   */
  async getSession(sessionId: string): Promise<any | null> {
    try {
      const data = await this.redis.get(sessionId);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Delete user session
   * @param sessionId - Session identifier
   */
  async deleteSession(sessionId: string): Promise<void> {
    try {
      await this.redis.del(sessionId);
    } catch (error) {
      this.logger.error(`Failed to delete session ${sessionId}:`, error);
      throw error;
    }
  }

  /**
   * Store cache data
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in seconds
   */
  async setCache(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redis.setex(key, ttl, JSON.stringify(data));
    } catch (error) {
      this.logger.error(`Failed to set cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get cached data
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  async getCache(key: string): Promise<any | null> {
    try {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      this.logger.error(`Failed to get cache for key ${key}:`, error);
      throw error;
    }
  }

  /**
   * Invalidate cache by pattern
   * @param pattern - Cache key pattern
   */
  async invalidateCache(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      this.logger.error(`Failed to invalidate cache pattern ${pattern}:`, error);
      throw error;
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}