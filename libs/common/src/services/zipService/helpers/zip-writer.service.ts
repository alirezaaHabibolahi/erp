import { Injectable } from '@nestjs/common';

import * as fs from 'fs/promises';
import * as path from 'path';
import JSZip from 'jszip';

import { ZipAddBufferOptions } from '@app/common/services';
import { ZipAddFileOptions } from '@app/common/services';
import { ZipCreateOptions } from '@app/common/services';

@Injectable()
export class ZipWriterService {

  create(
    options: ZipCreateOptions = {},
  ): JSZip {

    const zip = new JSZip();

    // Store configuration for later generation.
    Object.defineProperty(zip, '__compressionLevel', {
      value: options.compressionLevel ?? 9,
      enumerable: false,
      configurable: true,
      writable: true,
    });

    return zip;

  }

  async addFile(
    zip: JSZip,
    options: ZipAddFileOptions,
  ): Promise<void> {

    const buffer = await fs.readFile(options.source);

    zip.file(
      this.normalize(options.destination),
      buffer,
    );

  }

  async addFiles(
    zip: JSZip,
    files: ZipAddFileOptions[],
  ): Promise<void> {

    for (const file of files) {

      await this.addFile(
        zip,
        file,
      );

    }

  }

  async addBuffer(
    zip: JSZip,
    options: ZipAddBufferOptions,
  ): Promise<void> {

    zip.file(
      this.normalize(options.destination),
      options.buffer,
    );

  }

  async addBuffers(
    zip: JSZip,
    files: ZipAddBufferOptions[],
  ): Promise<void> {

    for (const file of files) {

      await this.addBuffer(
        zip,
        file,
      );

    }

  }

  async addText(
    zip: JSZip,
    destination: string,
    text: string,
  ): Promise<void> {

    zip.file(
      this.normalize(destination),
      text,
    );

  }

  async addJson(
    zip: JSZip,
    destination: string,
    data: unknown,
    indent = 2,
  ): Promise<void> {

    zip.file(
      this.normalize(destination),
      JSON.stringify(
        data,
        null,
        indent,
      ),
    );

  }

  async addDirectory(
    zip: JSZip,
    source: string,
    destination = '',
  ): Promise<void> {

    await this.walk(
      zip,
      source,
      source,
      destination,
    );

  }

  remove(
    zip: JSZip,
    destination: string,
  ): void {

    zip.remove(
      this.normalize(destination),
    );

  }

  async toBuffer(
    zip: JSZip,
  ): Promise<Buffer> {

    const compressionLevel =
      (zip as any).__compressionLevel ?? 9;

    return zip.generateAsync({

      type: 'nodebuffer',

      compression: 'DEFLATE',

      compressionOptions: {

        level: compressionLevel,

      },

    });

  }

  async save(
    zip: JSZip,
    destination: string,
  ): Promise<void> {

    const buffer =
      await this.toBuffer(zip);

    await fs.mkdir(
      path.dirname(destination),
      {
        recursive: true,
      },
    );

    await fs.writeFile(
      destination,
      buffer,
    );

  }

  private async walk(
    zip: JSZip,
    root: string,
    current: string,
    destination: string,
  ): Promise<void> {

    const entries =
      await fs.readdir(
        current,
        {
          withFileTypes: true,
        },
      );

    for (const entry of entries) {

      const absolute =
        path.join(
          current,
          entry.name,
        );

      const relative =
        path.relative(
          root,
          absolute,
        );

      const zipPath =
        this.normalize(
          path.join(
            destination,
            relative,
          ),
        );

      if (entry.isDirectory()) {

        await this.walk(
          zip,
          root,
          absolute,
          destination,
        );

        continue;

      }

      const buffer =
        await fs.readFile(
          absolute,
        );

      zip.file(
        zipPath,
        buffer,
      );

    }

  }

  private normalize(
    value: string,
  ): string {

    return value.replace(
      /\\/g,
      '/',
    );

  }

}