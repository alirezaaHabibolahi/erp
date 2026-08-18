import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';

@Injectable()
export class TempService {

  /**
   * Returns the operating system temp directory.
   */
  getTempDirectory(): string {
    return os.tmpdir();
  }

  /**
   * Generates a random file/directory name.
   */
  generateName(length = 16): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Creates a temporary directory.
   *
   * Example:
   * C:\Users\User\AppData\Local\Temp\my-prefix-a8f7c2
   */
  async createTempDirectory(
    prefix = 'tmp-',
  ): Promise<string> {

    const directory = await fs.mkdtemp(
      path.join(this.getTempDirectory(), prefix),
    );

    return directory;
  }

  /**
   * Creates an empty temporary file.
   *
   * Example:
   * /tmp/4fd8e2d4.xlsx
   */
  async createTempFile(
    extension = '',
  ): Promise<string> {

    if (
      extension &&
      !extension.startsWith('.')
    ) {
      extension = '.' + extension;
    }

    const filePath = path.join(
      this.getTempDirectory(),
      `${this.generateName()}${extension}`,
    );

    await fs.writeFile(filePath, '');

    return filePath;
  }

  /**
   * Removes a temporary file.
   */
  async removeTempFile(
    filePath: string,
  ): Promise<void> {

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if already deleted
    }

  }

  /**
   * Removes a temporary directory recursively.
   */
  async removeTempDirectory(
    directory: string,
  ): Promise<void> {

    try {

      await fs.rm(directory, {
        recursive: true,
        force: true,
      });

    } catch {
      // Ignore
    }

  }

  /**
   * Creates a unique file path in the temp directory
   * without creating the file.
   */
  generateTempFilePath(
    extension = '',
  ): string {

    if (
      extension &&
      !extension.startsWith('.')
    ) {
      extension = '.' + extension;
    }

    return path.join(
      this.getTempDirectory(),
      `${this.generateName()}${extension}`,
    );

  }

  /**
   * Creates a unique directory path in the temp directory
   * without creating it.
   */
  generateTempDirectoryPath(): string {

    return path.join(
      this.getTempDirectory(),
      this.generateName(),
    );

  }

}