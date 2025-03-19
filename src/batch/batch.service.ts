import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from '../schemas/log.schema';
import Redis from 'ioredis';

@Injectable()
export class BatchService implements OnModuleInit, OnModuleDestroy {
  private queue: any[] = [];
  private readonly BATCH_SIZE = 1000;
  private readonly INTERVAL_MS = 5000; // 5초마다 처리
  private readonly REDIS_KEY = 'batch_queue_data';
  private redis: Redis;
  private intervalId: NodeJS.Timeout;

  constructor(
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
  ) {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
    });
  }

  async onModuleInit() {
    // Redis에서 저장된 데이터 복구
    const savedData = await this.redis.get(this.REDIS_KEY);
    if (savedData) {
      this.queue = JSON.parse(savedData);
      console.log(`Recovered ${this.queue.length} items from Redis`);
      // 복구 후 Redis의 데이터 삭제
      await this.redis.del(this.REDIS_KEY);
    }

    // 시그널 핸들러 등록
    process.on('SIGINT', this.handleShutdown.bind(this));
    process.on('SIGTERM', this.handleShutdown.bind(this));

    this.startBatchProcessing();
  }

  async onModuleDestroy() {
    await this.handleShutdown();
  }

  private async handleShutdown() {
    console.log('Shutting down...');
    
    // 인터벌 중지
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    // 큐 데이터를 Redis에 저장
    if (this.queue.length > 0) {
      await this.redis.set(this.REDIS_KEY, JSON.stringify(this.queue));
      console.log(`Saved ${this.queue.length} items to Redis`);
    }

    // Redis 연결 종료
    await this.redis.quit();
  }

  private startBatchProcessing() {
    this.intervalId = setInterval(async () => {
      await this.processBatch();
    }, this.INTERVAL_MS);
  }

  async addToQueue(data: any) {
    this.queue.push({
      message: 'Job processed',
      data,
      timestamp: new Date(),
    });
    console.log(`Added to queue. Current queue size: ${this.queue.length}`);
  }

  private async processBatch() {
    if (this.queue.length === 0) return;

    const batchSize = Math.min(this.BATCH_SIZE, this.queue.length);
    const batch = this.queue.splice(0, batchSize);

    try {
      const operations = batch.map(item => ({
        insertOne: {
          document: item,
          onDuplicateKeyUpdate: true,
        },
      }));

      await this.logModel.bulkWrite(operations);
      console.log(`Successfully processed batch of ${batchSize} items`);
    } catch (error) {
      console.error('Error processing batch:', error);
      // 에러 발생 시 처리되지 않은 항목들을 다시 큐에 추가
      this.queue.unshift(...batch);
    }
  }

  async getQueueSize() {
    return this.queue.length;
  }
} 