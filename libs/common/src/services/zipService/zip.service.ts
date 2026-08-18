import { Injectable, Logger } from '@nestjs/common';
import JSZip from 'jszip';

import { ZipReaderService } from './helpers/zip-reader.service';
import { ZipWriterService } from './helpers/zip-writer.service';

import { ZipOpenOptions } from '@app/common/services';
import { ZipCreateOptions } from '@app/common/services';
import { ZipAddFileOptions } from '@app/common/services';
import { ZipAddBufferOptions } from '@app/common/services';
import { ExtractOptions } from '@app/common/services';
import { ZipEntry } from '@app/common/services';

@Injectable()
export class ZipService {
  private readonly logger = new Logger(ZipService.name);

  constructor(
    private readonly reader: ZipReaderService,
    private readonly writer: ZipWriterService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   Reader                                   */
  /* -------------------------------------------------------------------------- */

  async open(options: ZipOpenOptions): Promise<JSZip> {
    this.logger.log(`Opening ZIP file...`);
    const zip = await this.reader.open(options);
    this.logger.log(`ZIP file opened successfully`);
    return zip;
  }

  async entries(zip: JSZip): Promise<ZipEntry[]> {
    return this.reader.entries(zip);
  }

  async readBuffer(zip: JSZip, filePath: string): Promise<Buffer> {
    return this.reader.readBuffer(zip, filePath);
  }

  async readText(
    zip: JSZip,
    filePath: string,
    encoding?: BufferEncoding,
  ): Promise<string> {
    return this.reader.readText(zip, filePath, encoding);
  }

  async readJson<T>(zip: JSZip, filePath: string): Promise<T> {
    return this.reader.readJson<T>(zip, filePath);
  }

  has(zip: JSZip, filePath: string): boolean {
    return this.reader.has(zip, filePath);
  }

  count(zip: JSZip): number {
    return this.reader.count(zip);
  }

  async extract(zip: JSZip, options: ExtractOptions): Promise<void> {
    return this.reader.extract(zip, options);
  }

  async validate(options: ZipOpenOptions): Promise<boolean> {
    return this.reader.validate(options);
  }

  async isZip(options: ZipOpenOptions): Promise<boolean> {
    return this.reader.isZip(options);
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Writer                                   */
  /* -------------------------------------------------------------------------- */

  create(options?: ZipCreateOptions): JSZip {
    return this.writer.create(options);
  }

  async addFile(zip: JSZip, options: ZipAddFileOptions): Promise<void> {
    return this.writer.addFile(zip, options);
  }

  async addFiles(zip: JSZip, options: ZipAddFileOptions[]): Promise<void> {
    return this.writer.addFiles(zip, options);
  }

  async addBuffer(zip: JSZip, options: ZipAddBufferOptions): Promise<void> {
    return this.writer.addBuffer(zip, options);
  }

  async addBuffers(zip: JSZip, options: ZipAddBufferOptions[]): Promise<void> {
    return this.writer.addBuffers(zip, options);
  }

  async addText(zip: JSZip, destination: string, text: string): Promise<void> {
    return this.writer.addText(zip, destination, text);
  }

  async addJson(
    zip: JSZip,
    destination: string,
    data: unknown,
    indent?: number,
  ): Promise<void> {
    return this.writer.addJson(zip, destination, data, indent);
  }

  async addDirectory(
    zip: JSZip,
    source: string,
    destination?: string,
  ): Promise<void> {
    return this.writer.addDirectory(zip, source, destination);
  }

  remove(zip: JSZip, destination: string): void {
    return this.writer.remove(zip, destination);
  }

  async toBuffer(zip: JSZip): Promise<Buffer> {
    return this.writer.toBuffer(zip);
  }

  async save(zip: JSZip, destination: string): Promise<void> {
    return this.writer.save(zip, destination);
  }
}