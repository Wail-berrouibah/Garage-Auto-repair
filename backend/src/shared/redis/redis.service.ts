import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    try {
      this.client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        retryStrategy() {
          return null;
        },
        lazyConnect: true,
        enableOfflineQueue: false,
      });

      this.client.on('error', (err) => {
        this.logger.error(`Redis error: ${err.message}`);
      });

      this.client
        .connect()
        .then(() => {
          this.logger.log('Connected to Redis');
        })
        .catch((err) => {
          this.logger.warn(`Redis unavailable, running without cache: ${err.message}`);
          this.client?.disconnect();
          this.client = null;
        });
    } catch (err) {
      this.logger.warn(`Redis unavailable, running without cache: ${(err as Error).message}`);
    }
  }

  onModuleDestroy() {
    this.client?.disconnect();
  }

  private check(): Redis {
    if (!this.client) throw new Error('Redis not available');
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.check().get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      const client = this.check();
      if (ttlSeconds) {
        await client.set(key, value, 'EX', ttlSeconds);
      } else {
        await client.set(key, value);
      }
    } catch {
      // silently skip
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.check().del(key);
    } catch {
      // silently skip
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.check().exists(key);
      return result === 1;
    } catch {
      return false;
    }
  }

  async expire(key: string, seconds: number): Promise<void> {
    try {
      await this.check().expire(key, seconds);
    } catch {
      // silently skip
    }
  }
}
