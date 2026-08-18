import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronService } from '../cron.service';

@Injectable()
export class TestJob {
  constructor(private readonly cronService: CronService) {}

  @Cron('*/60 * * * * *') // every 10 seconds
  async handle() {
    const jobName = 'test cron job';

    // this.cronService.logStart(jobName);
    // try {
    //   this.cronService.logSuccess(jobName);
    // } catch (error) {
    //   this.cronService.logError(jobName, error);
    // }
  }
}
