import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Log, LogDocument } from './schemas/log.schema';
import { BatchService } from './batch/batch.service';

@Injectable()
export class AppService {
  constructor(
    @InjectModel(Log.name) private logModel: Model<LogDocument>,
    private batchService: BatchService,
  ) {}

  async addJob(data: any) {
    await this.batchService.addToQueue(data);
    return { message: 'Job added to batch queue successfully' };
  }

  async getLogs() {
    return this.logModel.find().sort({ timestamp: -1 }).exec();
  }

  async getQueueSize() {
    return this.batchService.getQueueSize();
  }
}
