import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Log, LogSchema } from './schemas/log.schema';
import { BatchModule } from './batch/batch.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://admin:password123@localhost:27017/log-server?authSource=admin'),
    MongooseModule.forFeature([{ name: Log.name, schema: LogSchema }]),
    BatchModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
