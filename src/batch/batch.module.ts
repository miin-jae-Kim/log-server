import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Log, LogSchema } from '../schemas/log.schema';
import { BatchService } from './batch.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
  ],
  providers: [BatchService],
  exports: [BatchService],
})
export class BatchModule {} 