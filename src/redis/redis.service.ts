import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  constructor(
    @Inject('REDIS_CLIENT') private readonly redis: Redis
  ) {}

  /** Установить значение */
  async set(key: string, value: string, ttlSeconds?: number) {
    if (ttlSeconds) {
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.redis.set(key, value);
    }
  }

  /** Получить значение */
  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  /** Удалить ключ */
  async del(key: string): Promise<number> {
    return this.redis.del(key);
  }

  /** Проверить существование ключа */
  async exists(key: string): Promise<boolean> {
    return (await this.redis.exists(key)) > 0;
  }
}