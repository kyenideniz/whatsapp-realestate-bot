// queues/messageQueue.js
import Bull from 'bull';
import redis from '@/config/redis';

const messageQueue = new Bull('messages', {
  redis: process.env.REDIS_URL,
  settings: {
    backoffStrategies: {
      twilio: (attempts) => Math.min(attempts * 1000, 10000)
    }
  }
});

// High priority channel for retries
messageQueue.process('high', 5, async (job) => {
  if (job.data.attempts > 0) return handleJob(job);
});

// Low priority for new messages
messageQueue.process('low', 20, async (job) => {
  if (job.data.attempts === 0) return handleJob(job);
});

export const addToQueue = (data, priority = 'low') => {
  return messageQueue.add(data, {
    priority: priority === 'high' ? 1 : 3,
    attempts: 5,
    backoff: { type: 'twilio' }
  });
};