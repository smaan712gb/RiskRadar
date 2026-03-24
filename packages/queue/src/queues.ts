import { Queue, type QueueOptions } from 'bullmq';
import { getBullMQConnection } from './connection.js';
import { QueueNames, type QueueName } from './types.js';

const queueInstances = new Map<QueueName, Queue>();

const defaultQueueOptions: Partial<QueueOptions> = {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: {
      age: 24 * 60 * 60,
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60,
    },
  },
};

export function getQueue(name: QueueName): Queue {
  let queue = queueInstances.get(name);
  if (!queue) {
    queue = new Queue(name, {
      connection: getBullMQConnection(),
      ...defaultQueueOptions,
    });
    queueInstances.set(name, queue);
  }
  return queue;
}

export async function closeAllQueues(): Promise<void> {
  const closePromises = Array.from(queueInstances.values()).map((q) => q.close());
  await Promise.all(closePromises);
  queueInstances.clear();
}

export { QueueNames };
