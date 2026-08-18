import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as fs from 'fs/promises';

@Injectable()
export class ReaderService {

  async exists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  async read(
    path: string,
    encoding: BufferEncoding = 'utf8',
  ): Promise<string> {

    if (!(await this.exists(path))) {
      throw new NotFoundException(
        `File "${path}" does not exist.`,
      );
    }

    return fs.readFile(path, {
      encoding,
    });
  }

  async readBuffer(path: string): Promise<Buffer> {

    if (!(await this.exists(path))) {
      throw new NotFoundException(
        `File "${path}" does not exist.`,
      );
    }

    return fs.readFile(path);
  }

  async readJson<T>(path: string): Promise<T> {

    const content = await this.read(path);

    try {
      return JSON.parse(content) as T;
    } catch {

      throw new BadRequestException(
        `"${path}" is not a valid JSON file.`,
      );

    }

  }

  async isFile(path: string): Promise<boolean> {

    try {

      const stat = await fs.stat(path);

      return stat.isFile();

    } catch {

      return false;

    }

  }

  async isDirectory(path: string): Promise<boolean> {

    try {

      const stat = await fs.stat(path);

      return stat.isDirectory();

    } catch {

      return false;

    }

  }

  async stat(path: string) {

    if (!(await this.exists(path))) {
      throw new NotFoundException(path);
    }

    return fs.stat(path);

  }

  async size(path: string): Promise<number> {

    const stat = await this.stat(path);

    return stat.size;

  }

}