import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CronService {
  private readonly logger = new Logger('CronService');

  logStart(job: string) {
    this.logger.log(`⏱️ Starting cron job: ${job}`);
  }

  logSuccess(job: string) {
    this.logger.log(`✅ Finished cron job: ${job}`);
  }

  logError(job: string, error: any) {
    this.logger.error(`❌ Error in cron job: ${job}`, error.stack || error);
  }
}
