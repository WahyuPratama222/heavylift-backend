import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';

@Injectable()
export class RedisService {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  get redisClient(): Redis {
    return this.client;
  }

  // Store a key-value pair with an expiration time in seconds
  async set(key: string, value: string, ttlSeconds: number) {
    return this.client.set(key, value, 'EX', ttlSeconds);
  }

  // Retrieve the value stored at a given key
  async get(key: string) {
    return this.client.get(key);
  }

  // Delete a single key
  async del(key: string) {
    return this.client.del(key);
  }

  // Add a member to a set (used to track a user's active session ids)
  async sadd(key: string, member: string) {
    return this.client.sadd(key, member);
  }

  // Remove a member from a set (used when a session is rotated or logged out)
  async srem(key: string, member: string) {
    return this.client.srem(key, member);
  }

  // Retrieve all members of a set (used to fetch every active session id for a user)
  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  // Delete multiple keys concurrently in a single network round-trip via pipeline
  async pipelineDel(keys: string[]): Promise<void> {
    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();
  }
}