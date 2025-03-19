import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from '../schemas/log.schema';

@Injectable()
export class BatchService implements OnModuleInit {
  private queue: any[] = [];
  private readonly BATCH_SIZE = 1000;
  private readonly INTERVAL_MS = 5000; // 5초마다 처리

  constructor(
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
  ) {}

  onModuleInit() {
    this.startBatchProcessing();
  }

  private startBatchProcessing() {
    setInterval(async () => {
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