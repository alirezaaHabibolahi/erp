import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CronService } from '../cron.service';
import { StuffidService } from '../../stuffid/stuffid.service';
import { ImportLogService } from '../../logs/import-log.service';
import { StuffidRepository } from '../../stuffid/stuffid.repository';

@Injectable()
export class StuffidImportJob {
  private readonly logger = new Logger(StuffidImportJob.name);
  private isJobRunning = false;
  private consecutiveFailures = 0;
  private readonly MAX_CONSECUTIVE_FAILURES = 3;

  constructor(
    private readonly cronService: CronService,
    private readonly stuffidService: StuffidService,
    private readonly importLogService: ImportLogService,
  ) {}

  /**
   * First import attempt at 12 AM - ALWAYS runs (no check)
   */
  @Cron('0 0 0 * * *', {
    name: 'stuffid-import-midnight',
    timeZone: 'Asia/Tehran',
  })
  async handleMidnightImport() {
    this.logger.log('🌙 Midnight import - running without checks');
    await this.runImportJob('midnight', false); // false = skip status check
  }

  /**
   * Retry import at 1 AM - only runs if previous import failed
   */
  @Cron('0 0 1 * * *', {
    name: 'stuffid-import-1am',
    timeZone: 'Asia/Tehran',
  })
  async handle1AMImport() {
    this.logger.log('🕐 1 AM import - checking previous status');
    await this.runImportJob('periodic', true); // true = check status first
  }

  /**
   * Retry import at 2 AM - only runs if previous import failed
   */
  @Cron('0 0 2 * * *', {
    name: 'stuffid-import-2am',
    timeZone: 'Asia/Tehran',
  })
  async handle2AMImport() {
    this.logger.log('🕑 2 AM import - checking previous status');
    await this.runImportJob('periodic', true);
  }

  /**
   * Last retry at 3 AM - only runs if previous import failed
   */
  @Cron('0 0 3 * * *', {
    name: 'stuffid-import-3am',
    timeZone: 'Asia/Tehran',
  })
  async handle3AMImport() {
    this.logger.log('🕒 3 AM import - last retry attempt');
    await this.runImportJob('periodic', true);
  }

  /**
   * Health check - runs every 30 minutes
   */
  // @Cron('*/30 * * * *', {
  //   name: 'stuffid-health-check',
  //   timeZone: 'Asia/Tehran',
  // })
  // async handleHealthCheck() {
  //   try {
  //     const isRunning =
  //       this.stuffidService.isImportRunning() || this.isJobRunning;
  //
  //     if (isRunning) {
  //       this.logger.log('Import process is currently running...');
  //       return;
  //     }
  //
  //     // Check for consecutive failures
  //     if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
  //       this.logger.error(
  //         `⚠️ ALERT: Import job has failed ${this.consecutiveFailures} times consecutively!`,
  //       );
  //     }
  //   } catch (error) {
  //     this.logger.error(`Health check error: ${error.message}`);
  //   }
  // }

  /**
   * Main import job runner
   * @param type - Type of import for logging
   * @param checkPreviousStatus - If true, skip if last import was successful
   */
  private async runImportJob(
    type: string,
    checkPreviousStatus: boolean,
  ): Promise<void> {
    const jobName = `stuffid-import-${type}`;

    // Prevent concurrent runs
    if (this.isJobRunning) {
      this.logger.warn(
        `⚠️ Import job already running. Skipping ${type} import.`,
      );
      return;
    }

    if (this.stuffidService.isImportRunning()) {
      this.logger.warn(
        `⚠️ Import service is processing. Skipping ${type} import.`,
      );
      return;
    }

    // Check previous import status if required
    if (checkPreviousStatus) {
      const shouldRun = await this.shouldRunImport();

      if (!shouldRun) {
        this.logger.log(
          `✅ Skipping ${type} import - last import was successful`,
        );
        return;
      }

      this.logger.log(
        `⚠️ Last import was not successful, running ${type} import...`,
      );
    }

    // Run the import
    this.isJobRunning = true;
    const startTime = Date.now();
    let batchId: string = '';

    this.cronService.logStart(jobName);
    this.logger.log(
      `🚀 Starting ${type} import at ${new Date().toISOString()}`,
    );

    try {
      // Get file list first
      const files = await this.stuffidService.getFilesList();

      this.logger.log(`Found ${files.length} files to process`);

      // Create import log entry
      batchId = await this.importLogService.logImportStart(type, files.length);

      // Run the import
      const result = await this.stuffidService.importAllProducts(batchId, files);

      if (result.success) {
        // Success - reset failure count
        this.consecutiveFailures = 0;
        this.cronService.logSuccess(jobName);

        // Update import log
        const finalStatus =
          result.stats.errors.length > 0 ? 'partial' : 'success';
        await this.importLogService.logImportComplete(
          batchId,
          result.stats,
          finalStatus,
        );

        // Log success details
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        const recordsPerSecond =
          result.stats.processingTime > 0
            ? Math.round(
                result.stats.totalProducts / result.stats.processingTime,
              )
            : 0;

        this.logger.log(`
          ✅ Import completed successfully:
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Batch ID: ${batchId}
          Type: ${type}
          Status: ${finalStatus}
          Files: ${result.stats.filesProcessed}/${result.stats.totalFiles}
          Total Records: ${result.stats.totalProducts.toLocaleString()}
          Inserted: ${result.stats.productsInserted.toLocaleString()}
          Failed: ${result.stats.productsFailed.toLocaleString()}
          Processing Time: ${result.stats.processingTime.toFixed(2)}s
          Records/Second: ${recordsPerSecond.toLocaleString()}
          Total Duration: ${duration}s
          Errors: ${result.stats.errors.length}
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);

        // Log any non-critical errors
        if (result.stats.errors.length > 0) {
          this.logger.warn(
            `Non-critical errors (${result.stats.errors.length}):\n` +
              result.stats.errors.slice(0, 10).join('\n') +
              (result.stats.errors.length > 10
                ? `\n... and ${result.stats.errors.length - 10} more`
                : ''),
          );
        }
      } else {
        // Failure
        this.consecutiveFailures++;
        this.cronService.logError(jobName, new Error(result.message));

        // Update import log
        await this.importLogService.logImportComplete(
          batchId,
          result.stats,
          'failed',
        );

        this.logger.error(`
          ❌ Import failed:
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Batch ID: ${batchId}
          Type: ${type}
          Error: ${result.message}
          Consecutive Failures: ${this.consecutiveFailures}
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        `);

        // Alert if max failures reached
        if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
          this.sendAlert(
            'CRITICAL: Stuffid Import Failed Multiple Times',
            `Import has failed ${this.consecutiveFailures} times. Last error: ${result.message}`,
          );
        }
      }
    } catch (error) {
      // Unexpected error
      this.consecutiveFailures++;
      this.cronService.logError(jobName, error);

      this.logger.error(
        `💥 Import job crashed with unexpected error: ${error.message}`,
        error.stack,
      );

      // Try to log the failure if we have a batchId
      if (batchId) {
        try {
          await this.importLogService.logImportComplete(
            batchId,
            {
              errors: [`Unexpected error: ${error.message}`],
              totalFiles: 0,
              filesProcessed: 0,
              totalProducts: 0,
              productsInserted: 0,
              productsFailed: 0,
              processingTime: 0
            },
            'failed',
          );

          this.stuffidService.cleanUpBatch(batchId).then().catch((err) => {})

        } catch (logError) {
          this.logger.error(`Failed to log error: ${logError.message}`);
        }
      }

      // Alert for unexpected errors
      if (this.consecutiveFailures >= this.MAX_CONSECUTIVE_FAILURES) {
        this.sendAlert(
          'CRITICAL: Stuffid Import Crashed',
          `Unexpected error: ${error.message}\n\nStack: ${error.stack}`,
        );
      }
    } finally {
      this.isJobRunning = false;

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      this.logger.log(`Import job (${type}) finished in ${duration}s`);
    }
  }

  /**
   * Check if import should run based on last import log
   * @returns true if should run, false if last import was successful
   */
  private async shouldRunImport(): Promise<boolean> {
    try {
      // Get the most recent import log
      const recentLogs = await this.importLogService.getRecentLogs(1);

      if (!recentLogs || recentLogs.length === 0) {
        // No previous import logs - should run
        this.logger.log('No previous import logs found');
        return true;
      }

      const lastLog = recentLogs[0];

      // Check if the last log is from today
      const today = new Date();
      const lastLogDate = new Date(lastLog.startTime);

      const isFromToday =
        lastLogDate.getDate() === today.getDate() &&
        lastLogDate.getMonth() === today.getMonth() &&
        lastLogDate.getFullYear() === today.getFullYear();

      if (!isFromToday) {
        // Last log is from yesterday or older - should run
        this.logger.log(
          `Last import was from ${lastLogDate.toISOString()} (not today)`,
        );
        return true;
      }

      // Check if last import was successful
      if (lastLog.status === 'success') {
        this.logger.log(
          `Last import (${lastLog.batchId}) was successful at ${lastLog.endTime}. Skipping.`,
        );
        return false;
      }

      // Last import failed or was partial - should retry
      this.logger.log(`Last import status: "${lastLog.status}". Will retry.`);
      return true;
    } catch (error) {
      this.logger.error(`Error checking last import status: ${error.message}`);
      // If we can't check, run anyway to be safe
      return true;
    }
  }

  /**
   * Send alert notification
   */
  private sendAlert(title: string, message: string): void {
    this.logger.error(`🚨 ALERT: ${title}`);
    this.logger.error(message);
  }

  /**
   * Get current job status (for monitoring endpoints)
   */
  getJobStatus() {
    return {
      isRunning: this.isJobRunning || this.stuffidService.isImportRunning(),
      consecutiveFailures: this.consecutiveFailures,
      maxConsecutiveFailures: this.MAX_CONSECUTIVE_FAILURES,
    };
  }
}
