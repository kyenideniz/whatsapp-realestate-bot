// config/redis.js
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL, {
  enableAutoPipelining: true,
  maxRetriesPerRequest: 2,
  connectTimeout: 5000,
  enableOfflineQueue: false,
  tls: process.env.REDIS_SSL === 'true' ? {} : undefined,
});

redis.on('error', (err) => {
  console.error('Redis error:', err);
});

export default redis;