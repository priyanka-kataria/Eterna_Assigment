import { Queue, Worker, JobsOptions } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://127.0.0.1:6379', {
    maxRetriesPerRequest: null 
});

export const queueName = process.env.QUEUE_NAME ?? 'orders';
export const ordersQueue = new Queue(queueName, { connection });


export const addOrderJob = async (payload: any) => {
  const opts: JobsOptions = {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 500
    },
    removeOnComplete: true,
    removeOnFail: false
  };
  await ordersQueue.add('execute-order', payload, opts);
};

export function createWorker(processFn: (job: any) => Promise<void>) {
  return new Worker(queueName, async (job) => processFn(job), { 
    connection, 
    concurrency: 10 
  });
}