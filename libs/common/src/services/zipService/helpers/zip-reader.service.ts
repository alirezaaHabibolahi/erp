import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';

import * as fs from 'fs/promises';
import * as path from 'path';
import { Readable } from 'stream';
import * as JSZip from 'jszip';

import { ZipEntry } from '@app/common/services';
import { ZipOpenOptions } from '@app/common/services';
import { ExtractOptions } from '@app/common/services';

@Injectable()
export class ZipReaderService {
  private readonly logger = new Logger(ZipReaderService.name);

  /**
   * Opens a zip archive.
   */
  async open(options: ZipOpenOptions): Promise<JSZip> {
    try {
      const buffer = await this.loadBuffer(options);

      // Check if buffer is valid
      if (!buffer || buffer.length === 0) {
        throw new BadRequestException('Buffer is empty or invalid');
      }

      this.logger.log(`Loading ZIP from buffer of size: ${(buffer.length / 1024).toFixed(2)} KB`);

      // Make sure we're using the default import
      const JSZipClass = (JSZip as any).default || JSZip;

      const zip = await JSZipClass.loadAsync(buffer);

      if (!zip) {
        throw new BadRequestException('Failed to load ZIP file');
      }

      return zip;
    } catch (error) {
      this.logger.error(`Error opening ZIP: ${error.message}`);
      throw new BadRequestException(`Failed to open ZIP file: ${error.message}`);
    }
  }

  /**
   * Returns all entries.
   */
  async entries(zip: JSZip): Promise<ZipEntry[]> {
    try {
      const result: ZipEntry[] = [];

      for (const fileName of Object.keys(zip.files)) {
        const file = zip.files[fileName];

        let size = 0;

        if (!file.dir) {
          const buffer = await file.async('nodebuffer');
          size = buffer.length;
        }

        result.push(
          new ZipEntry(
            file.name,
            path.basename(file.name),
            path.extname(file.name),
            path.dirname(file.name),
            size,
            0,
            file.dir,
            file.date,
          ),
        );
      }

      return result;
    } catch (error) {
      this.logger.error(`Error getting entries: ${error.message}`);
      throw new BadRequestException(`Failed to get ZIP entries: ${error.message}`);
    }
  }

  /**
   * Reads one file as Buffer.
   */
  async readBuffer(zip: JSZip, filePath: string): Promise<Buffer> {
    try {
      const file = zip.file(filePath);

      if (!file) {
        throw new BadRequestException(
          `"${filePath}" not found in archive. Available files: ${Object.keys(zip.files).join(', ')}`,
        );
      }

      return file.async('nodebuffer');
    } catch (error) {
      this.logger.error(`Error reading buffer: ${error.message}`);
      throw new BadRequestException(`Failed to read file from ZIP: ${error.message}`);
    }
  }

  /**
   * Reads one file as text.
   */
  async readText(
    zip: JSZip,
    filePath: string,
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {
    const buffer = await this.readBuffer(zip, filePath);
    return buffer.toString(encoding);
  }

  /**
   * Reads one JSON file.
   */
  async readJson<T>(zip: JSZip, filePath: string): Promise<T> {
    const text = await this.readText(zip, filePath);
    return JSON.parse(text);
  }

  /**
   * Returns true if entry exists.
   */
  has(zip: JSZip, filePath: string): boolean {
    return zip.file(filePath) !== null;
  }

  /**
   * Number of entries.
   */
  count(zip: JSZip): number {
    return Object.keys(zip.files).length;
  }

  /**
   * Extract archive.
   */
  async extract(zip: JSZip, options: ExtractOptions): Promise<void> {
    try {
      const entries = Object.values(zip.files);

      await fs.mkdir(options.destination, {
        recursive: true,
      });

      for (const entry of entries) {
        const output = path.join(options.destination, entry.name);

        if (entry.dir) {
          await fs.mkdir(output, {
            recursive: true,
          });
          continue;
        }

        const buffer = await entry.async('nodebuffer');

        await fs.mkdir(path.dirname(output), {
          recursive: true,
        });

        await fs.writeFile(output, buffer, {
          flag: options.overwrite ? 'w' : 'wx',
        });
      }
    } catch (error) {
      this.logger.error(`Error extracting ZIP: ${error.message}`);
      throw new BadRequestException(`Failed to extract ZIP: ${error.message}`);
    }
  }

  /**
   * Checks whether the buffer/path is a valid zip.
   */
  async validate(options: ZipOpenOptions): Promise<boolean> {
    try {
      await this.open(options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Alias for validate().
   */
  async isZip(options: ZipOpenOptions): Promise<boolean> {
    return this.validate(options);
  }

  /**
   * Loads archive into memory.
   */
  private async loadBuffer(options: ZipOpenOptions): Promise<Buffer> {
    try {
      if (options.buffer) {
        this.logger.log('Loading ZIP from provided buffer');
        return options.buffer;
      }

      if (options.path) {
        this.logger.log(`Loading ZIP from path: ${options.path}`);

        // Check if file exists
        try {
          await fs.access(options.path);
        } catch {
          throw new BadRequestException(`File not found at path: ${options.path}`);
        }

        const stats = await fs.stat(options.path);
        this.logger.log(`File size: ${(stats.size / 1024).toFixed(2)} KB`);

        return fs.readFile(options.path);
      }

      if (options.stream) {
        this.logger.log('Loading ZIP from stream');
        const chunks: Buffer[] = [];

        for await (const chunk of options.stream as Readable) {
          chunks.push(Buffer.from(chunk));
        }

        const buffer = Buffer.concat(chunks);
        this.logger.log(`Stream loaded: ${(buffer.length / 1024).toFixed(2)} KB`);
        return buffer;
      }

      throw new BadRequestException('path, buffer or stream is required.');
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error loading buffer: ${error.message}`);
      throw new BadRequestException(`Failed to load file: ${error.message}`);
    }
  }
}