import { Worker } from 'bullmq';
import { Logger } from '@nestjs/common';

const logger = new Logger('Worker');

async function bootstrap() {
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  logger.log(`Connecting to Redis at ${redisUrl}`);

  const worker = new Worker(
    'default',
    async (job) => {
      logger.log(`Processing job ${job.id} of type ${job.name}`);
    },
    {
      connection: { url: redisUrl },
      concurrency: 5,
    },
  );

  worker.on('ready', () => {
    logger.log('Worker is ready and listening for jobs');
  });

  worker.on('error', (err) => {
    logger.error(`Worker error: ${err.message}`);
  });

  worker.on('completed', (job) => {
    logger.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    logger.error(`Job ${job?.id} failed: ${err.message}`);
  });

  logger.log('Worker started');
}

bootstrap().catch((err) => {
  logger.error(`Failed to start worker: ${err.message}`);
  process.exit(1);
});
