// services/ai.js
import crypto from 'crypto';
import redis from '../config/redis';

export async function cachedAIRequest(prompt) {
  const hash = crypto.createHash('md5').update(prompt).digest('hex');
  const cacheKey = `ai_cache:${hash}`;
  
  const cached = await redis.get(cacheKey);
  if (cached) return cached;

  const response = await fetchOpenRouterAPI(prompt); // Existing AI call
  await redis.setex(cacheKey, 300, response); // 5-min cache
  
  return response;
}