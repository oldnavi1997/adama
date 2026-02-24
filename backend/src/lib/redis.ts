import { createClient, type RedisClientType } from "redis";
import { env } from "../config/env.js";

let client: RedisClientType | null = null;
let connected = false;

export function hasRedisConfig(): boolean {
  return Boolean(env.redisUrl.trim());
}

export function getRedisClient(): RedisClientType | null {
  if (!hasRedisConfig()) return null;
  if (client) return client;

  client = createClient({ url: env.redisUrl });
  client.on("error", (error) => {
    // eslint-disable-next-line no-console
    console.error("[redis] error:", error);
    connected = false;
  });
  client.on("ready", () => {
    connected = true;
    // eslint-disable-next-line no-console
    console.log("[redis] connected");
  });
  client.on("end", () => {
    connected = false;
  });

  return client;
}

export async function connectRedis(): Promise<void> {
  const redis = getRedisClient();
  if (!redis) {
    // eslint-disable-next-line no-console
    console.log("[redis] REDIS_URL not set, running without redis features");
    return;
  }
  if (connected) return;
  if (!redis.isOpen) {
    await redis.connect();
  }
}

export async function redisGetString(key: string): Promise<string | null> {
  const redis = getRedisClient();
  if (!redis || !connected) return null;
  return redis.get(key);
}

export async function redisSetExString(key: string, ttlSeconds: number, value: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !connected) return;
  await redis.setEx(key, ttlSeconds, value);
}

export async function redisDeleteByPrefix(prefix: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis || !connected) return;
  const keys = await redis.keys(`${prefix}*`);
  if (keys.length > 0) {
    await redis.del(keys);
  }
}

export async function redisSetNxEx(key: string, value: string, ttlSeconds: number): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis || !connected) return false;
  const result = await redis.set(key, value, { NX: true, EX: ttlSeconds });
  return result === "OK";
}

export async function redisIncrWithExpire(key: string, ttlSeconds: number): Promise<number | null> {
  const redis = getRedisClient();
  if (!redis || !connected) return null;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, ttlSeconds);
  }
  return count;
}
