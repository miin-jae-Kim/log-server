import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Queue } from 'bull';
import { Log, LogDocument } from './schemas/log.schema';

@Injectable()
export class AppService {
  constructor(
    @InjectQueue('log-queue') private logQueue: Queue,
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
  ) {
    this.processQueue();
  }

  private async processQueue() {
    this.logQueue.process(async (job) => {
      console.log('Processing job:', job.data);
      
      // MongoDB에 로그 저장
      const log = new this.logModel({
        message: 'Job processed',
        data: job.data,
        timestamp: new Date(),
      });
      await log.save();
    });
  }

  async addJob(data: any) {
    await this.logQueue.add(data);
  }

  async getLogs() {
    return this.logModel.find().sort({ timestamp: -1 }).exec();
  }
}
