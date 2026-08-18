import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ImportLogService } from '../../logs/import-log.service';
import { StuffidRepository } from '../../stuffid/stuffid.repository';


@Injectable()
export class StuffidCleanupJob {
  private readonly logger = new Logger(StuffidCleanupJob.name);
  private isRunning = false;

  constructor(
    private readonly importLogService: ImportLogService,
    private readonly stuffidRepository: StuffidRepository,
  ) {}

  /**
   * Cleanup job - runs at 4 AM
   * Checks if last import was successful, then deletes old batches
   */
  @Cron('0 0 4 * * *', {
    name: 'stuffid-cleanup',
    timeZone: 'Asia/Tehran',
  })
  async handleCleanup() {
    await this.runInvalidJob();
  }

  @Cron('0 0 5 * * *', {
    name: 'stuffid-cleanup-retry',
    timeZone: 'Asia/Tehran',
  })
  async handleCleanupRetry() {
    await this.runInvalidJob();
  }


  private async runInvalidJob(){
    if (this.isRunning) {
      this.logger.warn('Cleanup job already running. Skipping...');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      this.logger.log('🧹 Starting cleanup check...');

      const recentLog = await this.importLogService.getLastSuccessLog();

      if (!recentLog) {
        this.logger.log('No import logs found. Skipping cleanup.');
        return;
      }

      // if (recentLog.status !== 'success') {
      //   this.logger.warn(
      //     `Last import status is "${recentLog.status}". Skipping cleanup to preserve data.`
      //   );
      //   return;
      // }

      const activeBatchId = recentLog.batchId;

      this.logger.log(
        `Last successful import: Batch ${activeBatchId} at ${recentLog.endTime}`
      );
      this.logger.log(`Will delete all records not in batch ${activeBatchId}`);

      // Get stats before cleanup
      // const statsBefore = await this.stuffidRepository.getImportStats();
      // this.logger.log(
      //   `Before cleanup: ${statsBefore.totalRecords.toLocaleString()} total records, ` +
      //   `${statsBefore.activeRecords.toLocaleString()} active`
      // );

      const deleteResult = await this.deleteOldBatchesInChunks(activeBatchId);

      //const statsAfter = await this.stuffidRepository.getImportStats();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      this.logger.log(`
        ✅ Cleanup completed successfully:
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        Active Batch: ${activeBatchId}
        Records Deleted: ${deleteResult.toLocaleString()}
        Time: ${duration}s
        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
      `);

    } catch (error) {
      this.logger.error(`Cleanup job failed: ${error.message}`, error.stack);
    } finally {
      this.isRunning = false;
    }
  }


  private async deleteOldBatchesInChunks(
    activeBatchId: string
  ): Promise<number> {
    const BATCH_SIZE = 5000;
    let totalDeleted = 0;
    let hasMore = true;

    this.logger.log(`Starting chunked deletion (batch size: ${BATCH_SIZE.toLocaleString()})...`);

    while (hasMore) {
      try {
        const result = await this.stuffidRepository.deleteOldBatchChunk(
          activeBatchId,
          BATCH_SIZE
        );

        totalDeleted += result;

        if (totalDeleted % 500000 === 0) {
          this.logger.log(`Cleanup progress: ${totalDeleted.toLocaleString()} records deleted...`);
        }

        // If less than batch size was deleted, we're done
        if (result < BATCH_SIZE) {
          hasMore = false;
        }

        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        this.logger.error(`Error in chunked deletion: ${error.message}`);

        // If we've already deleted some, consider it partial success
        if (totalDeleted > 0) {
          this.logger.warn(`Partial cleanup: ${totalDeleted.toLocaleString()} records deleted`);
          hasMore = false;
        } else {
          throw error;
        }
      }
    }

    return totalDeleted;
  }
}