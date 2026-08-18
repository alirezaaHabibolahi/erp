import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CronService } from './cron.service';

import { TestJob} from './jobs/test.job';
import { StuffidImportJob } from './jobs/stuffid-import-products.job';
import { StuffidModule } from '../stuffid/stuffid.module';
import { ImportLogModule } from '../logs/import-log.module';
import { StuffidCleanupJob } from './jobs/stuffid-cleanup.job';


@Module({
  imports: [ScheduleModule.forRoot(), StuffidModule, ImportLogModule],
  providers: [
    CronService,
    TestJob,
    StuffidImportJob,
    StuffidCleanupJob
  ],
})
export class CronModule {}
