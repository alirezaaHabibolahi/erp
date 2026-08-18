import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class WriterService {

  /* -------------------------------------------------------------------------- */
  /*                                  Helpers                                   */
  /* -------------------------------------------------------------------------- */

  private async exists(target: string): Promise<boolean> {
    try {
      await fs.access(target);
      return true;
    } catch {
      return false;
    }
  }

  private async ensureDirectory(directory: string): Promise<void> {
    await fs.mkdir(directory, {
      recursive: true,
    });
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Write                                    */
  /* -------------------------------------------------------------------------- */

  async write(
    filePath: string,
    data: string | Buffer,
    options?: {
      overwrite?: boolean;
      encoding?: BufferEncoding;
      createDirectory?: boolean;
    },
  ): Promise<void> {

    const {
      overwrite = true,
      encoding = 'utf8',
      createDirectory = true,
    } = options ?? {};

    if (createDirectory) {
      await this.ensureDirectory(
        path.dirname(filePath),
      );
    }

    if (!overwrite && (await this.exists(filePath))) {
      throw new ConflictException(
        `"${filePath}" already exists.`,
      );
    }

    await fs.writeFile(
      filePath,
      data,
      typeof data === 'string'
        ? { encoding }
        : undefined,
    );
  }

  async writeJson(
    filePath: string,
    data: unknown,
    indent = 4,
  ): Promise<void> {

    await this.write(
      filePath,
      JSON.stringify(data, null, indent),
    );

  }

  async append(
    filePath: string,
    data: string | Buffer,
  ): Promise<void> {

    await this.ensureDirectory(
      path.dirname(filePath),
    );

    await fs.appendFile(
      filePath,
      data,
    );

  }

  async touch(filePath: string): Promise<void> {

    await this.ensureDirectory(
      path.dirname(filePath),
    );

    if (!(await this.exists(filePath))) {

      await fs.writeFile(
        filePath,
        '',
      );

      return;

    }

    const now = new Date();

    await fs.utimes(
      filePath,
      now,
      now,
    );

  }

  async truncate(filePath: string): Promise<void> {

    if (!(await this.exists(filePath))) {
      throw new NotFoundException(filePath);
    }

    await fs.truncate(filePath);

  }

  /* -------------------------------------------------------------------------- */
  /*                                  Copy                                      */
  /* -------------------------------------------------------------------------- */

  async copy(
    source: string,
    destination: string,
    overwrite = true,
  ): Promise<void> {

    if (!(await this.exists(source))) {
      throw new NotFoundException(source);
    }

    if (!overwrite && (await this.exists(destination))) {
      throw new ConflictException(destination);
    }

    await this.ensureDirectory(
      path.dirname(destination),
    );

    await fs.copyFile(
      source,
      destination,
    );

  }

  /* -------------------------------------------------------------------------- */
  /*                                   Move                                     */
  /* -------------------------------------------------------------------------- */

  async move(
    source: string,
    destination: string,
    overwrite = true,
  ): Promise<void> {

    if (!(await this.exists(source))) {
      throw new NotFoundException(source);
    }

    if (!overwrite && (await this.exists(destination))) {
      throw new ConflictException(destination);
    }

    await this.ensureDirectory(
      path.dirname(destination),
    );

    try {

      await fs.rename(
        source,
        destination,
      );

    } catch {

      await this.copy(
        source,
        destination,
        overwrite,
      );

      await this.delete(source);

    }

  }

  /* -------------------------------------------------------------------------- */
  /*                                  Rename                                    */
  /* -------------------------------------------------------------------------- */

  async rename(
    filePath: string,
    newName: string,
  ): Promise<string> {

    if (!(await this.exists(filePath))) {
      throw new NotFoundException(filePath);
    }

    const destination = path.join(
      path.dirname(filePath),
      newName,
    );

    await fs.rename(
      filePath,
      destination,
    );

    return destination;

  }

  /* -------------------------------------------------------------------------- */
  /*                                  Delete                                    */
  /* -------------------------------------------------------------------------- */

  async delete(
    filePath: string,
    force = true,
  ): Promise<void> {

    if (!(await this.exists(filePath))) {

      if (force) {
        return;
      }

      throw new NotFoundException(filePath);

    }

    await fs.unlink(filePath);

  }

}