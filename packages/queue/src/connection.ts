import { type ConnectionOptions } from 'bullmq';
import IORedis from 'ioredis';

let redisInstance: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!redisInstance) {
    const redisUrl = process.env['REDIS_URL'] ?? 'redis://localhost:6379';
    redisInstance = new IORedis(redisUrl, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
  }
  return redisInstance;
}

export function getBullMQConnection(): ConnectionOptions {
  return getRedisConnection();
}

export async function closeRedisConnection(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
