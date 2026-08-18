import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class DirectoryService {

  async exists(directory: string): Promise<boolean> {
    try {
      await fs.access(directory);
      return true;
    } catch {
      return false;
    }
  }

  async ensure(directory: string): Promise<void> {
    await fs.mkdir(directory, {
      recursive: true,
    });
  }

  async create(directory: string): Promise<void> {

    if (await this.exists(directory)) {
      return;
    }

    await fs.mkdir(directory);

  }

  async delete(directory: string): Promise<void> {

    if (!(await this.exists(directory))) {
      return;
    }

    await fs.rm(directory, {
      recursive: true,
      force: true,
    });

  }

  async empty(directory: string): Promise<void> {

    if (!(await this.exists(directory))) {
      throw new NotFoundException(directory);
    }

    const entries = await fs.readdir(directory);

    await Promise.all(
      entries.map(entry =>
        fs.rm(
          path.join(directory, entry),
          {
            recursive: true,
            force: true,
          },
        ),
      ),
    );

  }

  async list(directory: string): Promise<string[]> {

    if (!(await this.exists(directory))) {
      throw new NotFoundException(directory);
    }

    return fs.readdir(directory);

  }

  async listAbsolute(directory: string): Promise<string[]> {

    const entries = await this.list(directory);

    return entries.map(entry =>
      path.join(directory, entry),
    );

  }

  async count(directory: string): Promise<number> {

    const entries = await this.list(directory);

    return entries.length;

  }

  async isEmpty(directory: string): Promise<boolean> {

    return (await this.count(directory)) === 0;

  }

  async directorySize(directory: string): Promise<number> {

    let total = 0;

    const entries = await fs.readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {

      const fullPath = path.join(
        directory,
        entry.name,
      );

      if (entry.isDirectory()) {

        total += await this.directorySize(fullPath);

      } else {

        const stat = await fs.stat(fullPath);

        total += stat.size;

      }

    }

    return total;

  }

}