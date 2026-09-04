import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { ApiRestService } from '@app/common/services';
import { getErrorMessage } from '@app/common/utils';

@Injectable()
export class DownloadService {
  private readonly logger = new Logger(DownloadService.name);
  private readonly axiosInstance: AxiosInstance;
  private readonly downloadDir: string;

  // Platform-specific User-Agent
  private readonly userAgent: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly restService: ApiRestService,
  ) {
    this.downloadDir = path.join(process.cwd(), 'downloads');

    // Ensure download directory exists
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    // Generate appropriate User-Agent based on platform
    this.userAgent = this.generateUserAgent();

    this.logger.log(`Running on: ${os.platform()} (${os.type()})`);
    this.logger.log(`User-Agent: ${this.userAgent}`);

    this.axiosInstance = axios.create({
      timeout: 300000, // 5 minutes default timeout
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
      responseType: 'stream',
      maxRedirects: 5,
      httpsAgent: new (require('https').Agent)({
        rejectUnauthorized: false,
        keepAlive: true,
      }),
    });
  }

  /**
   * Downloads a file using streaming with timeout cancellation
   * @param downloadUrl - The URL to download from
   * @param fileName - Local filename to save as
   * @param timeoutMs - Timeout in milliseconds (default 5 minutes)
   * @param retries - Number of retry attempts
   */
  async downloadFile(
    downloadUrl: string,
    fileName: string,
    timeoutMs: number = 300000, // 5 minutes default
    retries: number = 3,
  ): Promise<string> {
    const filePath = path.join(this.downloadDir, fileName);

    this.logger.log(`Starting download: ${downloadUrl}`);
    this.logger.log(`Destination: ${filePath}`);
    this.logger.log(`Timeout: ${timeoutMs / 1000}s`);

    let lastError: unknown;

    for (let attempt = 1; attempt <= retries; attempt++) {
      // Create an AbortController for timeout cancellation
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        this.logger.warn(
          `Download timeout after ${timeoutMs / 1000}s - aborting...`,
        );
      }, timeoutMs);

      try {
        this.logger.log(`Download attempt ${attempt}/${retries}`);

        // Clean up any partial download from previous attempt
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }

        const response = await this.axiosInstance.get(downloadUrl, {
          headers: {
            Accept: 'application/zip, application/octet-stream, */*',
            'Accept-Encoding': 'gzip, deflate, br',
            'User-Agent': this.userAgent,
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
          signal: controller.signal, // Pass abort signal
          timeout: timeoutMs, // Axios timeout
          onDownloadProgress: (progressEvent) => {
            // Log progress every 10MB
            if (progressEvent.loaded % (10 * 1024 * 1024) === 0) {
              const loadedMB = (progressEvent.loaded / (1024 * 1024)).toFixed(
                2,
              );
              const totalMB = progressEvent.total
                ? (progressEvent.total / (1024 * 1024)).toFixed(2)
                : 'unknown';
              this.logger.log(
                `Download progress: ${loadedMB}MB / ${totalMB}MB`,
              );
            }
          },
        });

        // Check response status
        if (response.status === 404) {
          throw new Error(`File not found (404): ${downloadUrl}`);
        }

        if (response.status === 403) {
          throw new Error(`Access forbidden (403): ${downloadUrl}`);
        }

        if (response.status >= 400) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        // Create write stream
        const writer = createWriteStream(filePath, {
          flags: 'w',
          encoding: 'binary',
        });

        writer.on('error', (error) => {
          this.logger.error(`Write stream error: ${error.message}`);
          controller.abort(); // Abort download if write fails
        });

        // Use pipeline for efficient streaming
        await pipeline(response.data, writer);

        // Clear timeout since download completed
        clearTimeout(timeoutId);

        // Verify file was downloaded successfully
        const stats = await fs.promises.stat(filePath);

        if (stats.size === 0) {
          throw new Error('Downloaded file is empty');
        }

        this.logger.log(`Download completed: ${filePath}`);
        this.logger.log(
          `File size: ${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
        );

        return filePath;
      } catch (error) {
        // Clear timeout
        clearTimeout(timeoutId);

        lastError = error;
        const message = getErrorMessage(error);

        // Check if request was aborted due to timeout
        if (
          axios.isCancel(error) ||
          (axios.isAxiosError(error) &&
            (error.code === 'ERR_CANCELED' || error.code === 'ECONNABORTED'))
        ) {
          this.logger.error(
            `Download aborted/timeout after ${timeoutMs / 1000}s`,
          );
        } else if (axios.isAxiosError(error) && error.response) {
          this.logger.error(
            `Download failed with status ${error.response.status}: ${message}`,
          );
        } else {
          this.logger.error(`Download error: ${message}`);
        }

        // Clean up partial download
        if (fs.existsSync(filePath)) {
          try {
            await fs.promises.unlink(filePath);
          } catch (cleanupError) {
            this.logger.error(
              `Failed to cleanup: ${getErrorMessage(cleanupError)}`,
            );
          }
        }

        if (attempt < retries) {
          const delay = attempt * 2000;
          this.logger.log(`Retrying in ${delay / 1000}s...`);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `Failed to download file after ${retries} attempts. Last error: ${getErrorMessage(lastError)}`,
    );
  }

  /**
   * Download with progress callback
   */
  async downloadWithProgress(
    downloadUrl: string,
    fileName: string,
    timeoutMs: number = 300000,
    onProgress?: (percent: number, loadedMB: number, totalMB: number) => void,
  ): Promise<string> {
    const filePath = path.join(this.downloadDir, fileName);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    this.logger.log(`Starting download with progress: ${downloadUrl}`);

    try {
      const response = await this.axiosInstance.get(downloadUrl, {
        headers: {
          Accept: 'application/zip, application/octet-stream, */*',
          'User-Agent': this.userAgent,
        },
        signal: controller.signal,
        timeout: timeoutMs,
        onDownloadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            const loadedMB = +(progressEvent.loaded / (1024 * 1024)).toFixed(2);
            const totalMB = +(progressEvent.total / (1024 * 1024)).toFixed(2);
            onProgress(percent, loadedMB, totalMB);
          }
        },
      });

      const writer = createWriteStream(filePath);
      await pipeline(response.data, writer);
      clearTimeout(timeoutId);

      this.logger.log(`Download completed: ${filePath}`);
      return filePath;
    } catch (error) {
      clearTimeout(timeoutId);
      const message = getErrorMessage(error);

      this.logger.error(`Download failed: ${message}`);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }

      throw new Error(`Failed to download file: ${message}`);
    }
  }

  /**
   * Clean up downloaded files
   */
  async cleanupFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        this.logger.log(`Cleaned up file: ${filePath}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to cleanup file ${filePath}: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Clean up all files in download directory
   */
  async cleanupDownloadDirectory(directoryPath: string): Promise<void> {
    try {
      if (fs.existsSync(directoryPath)) {
        const files = await fs.promises.readdir(directoryPath);

        this.logger.log(
          `Cleaning download directory: ${files.length} files found`,
        );

        for (const file of files) {
          const filePath = path.join(directoryPath, file);
          try {
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
              await fs.promises.rm(filePath, { recursive: true, force: true });
            } else {
              await fs.promises.unlink(filePath);
            }

            this.logger.log(`Removed: ${file}`);
          } catch (error) {
            this.logger.error(
              `Failed to remove ${file}: ${getErrorMessage(error)}`,
            );
          }
        }

        this.logger.log('Download directory cleaned successfully');
      }
    } catch (error) {
      this.logger.error(
        `Failed to clean download directory: ${getErrorMessage(error)}`,
      );
    }
  }

  /**
   * Clean up files older than specified hours
   */
  async cleanupOldFiles(hoursOld: number = 24): Promise<void> {
    try {
      if (!fs.existsSync(this.downloadDir)) return;

      const files = await fs.promises.readdir(this.downloadDir);
      const now = Date.now();
      const maxAge = hoursOld * 60 * 60 * 1000;

      let cleanedCount = 0;

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        try {
          const stat = await fs.promises.stat(filePath);

          if (now - stat.mtimeMs > maxAge) {
            if (stat.isDirectory()) {
              await fs.promises.rm(filePath, { recursive: true, force: true });
            } else {
              await fs.promises.unlink(filePath);
            }
            cleanedCount++;
          }
        } catch (error) {
          this.logger.error(
            `Failed to process ${file}: ${getErrorMessage(error)}`,
          );
        }
      }

      if (cleanedCount > 0) {
        this.logger.log(
          `Cleaned ${cleanedCount} old files from download directory`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to clean old files: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Get download directory size in bytes
   */
  async getDownloadDirSize(): Promise<number> {
    try {
      if (!fs.existsSync(this.downloadDir)) return 0;

      let totalSize = 0;
      const files = await fs.promises.readdir(this.downloadDir);

      for (const file of files) {
        const filePath = path.join(this.downloadDir, file);
        try {
          const stat = await fs.promises.stat(filePath);
          totalSize += stat.size;
        } catch (error) {
          // Skip files that can't be accessed
        }
      }

      return totalSize;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Get the download directory path
   */
  getDownloadDir(): string {
    return this.downloadDir;
  }

  /**
   * Generate User-Agent based on operating system
   */
  private generateUserAgent(): string {
    const platform = os.platform();
    const arch = os.arch();
    const nodeVersion = process.version;

    switch (platform) {
      case 'linux':
        return `Mozilla/5.0 (X11; Linux ${arch}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`;

      case 'darwin':
        return `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`;

      case 'win32':
        return `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36`;

      default:
        return `PersonalBot/1.0 (${platform}; ${arch}) Node.js/${nodeVersion}`;
    }
  }
}
