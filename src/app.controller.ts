import { Controller, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * curl -X POST http://localhost:3000/add-job -H "Content-Type: application/json" -d '{"message": "Hello from Batch Queue!"}'
   */
  @Post('add-job')
  async addJob(@Body() data: any) {
    return this.appService.addJob(data);
  }

  @Get('logs')
  async getLogs() {
    return this.appService.getLogs();
  }

  @Get('queue-size')
  async getQueueSize() {
    return { size: await this.appService.getQueueSize() };
  }
}
