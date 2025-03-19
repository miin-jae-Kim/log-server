import { Controller, Post, Body, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * curl -X POST http://localhost:3000/add-job -H "Content-Type: application/json" -d '{"message": "Hello from Bull Queue!"}'
   */
  @Post('add-job')
  async addJob(@Body() data: any) {
    await this.appService.addJob(data);
    return { message: 'Job added successfully' };
  }

  @Get('logs')
  async getLogs() {
    return this.appService.getLogs();
  }
}
