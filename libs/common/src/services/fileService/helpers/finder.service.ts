import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { FileInfo } from '../interfaces/file-info.interface';
import { ListOptions } from '../interfaces/list-options.interface';

@Injectable()
export class FinderService {

  async list(options: ListOptions): Promise<FileInfo[]> {
    const {
      path: root,
      recursive = false,
      filesOnly = false,
      directoriesOnly = false,
      includeHidden = false,
      extensions = [],
    } = options;

    const exists = await this.exists(root);

    if (!exists) {
      throw new NotFoundException(root);
    }

    return this.walk(
      root,
      recursive,
      filesOnly,
      directoriesOnly,
      includeHidden,
      extensions.map(ext => ext.toLowerCase()),
    );
  }

  async find(options: ListOptions): Promise<FileInfo[]> {
    return this.list(options);
  }

  async findFirst(options: ListOptions): Promise<FileInfo | null> {
    const result = await this.list(options);

    return result.length ? result[0] : null;
  }

  async count(options: ListOptions): Promise<number> {
    const result = await this.list(options);

    return result.length;
  }

  async exists(target: string): Promise<boolean> {
    try {
      await fs.access(target);
      return true;
    } catch {
      return false;
    }
  }

  private async walk(
    directory: string,
    recursive: boolean,
    filesOnly: boolean,
    directoriesOnly: boolean,
    includeHidden: boolean,
    extensions: string[],
  ): Promise<FileInfo[]> {

    const result: FileInfo[] = [];

    const entries = await fs.readdir(directory, {
      withFileTypes: true,
    });

    for (const entry of entries) {

      if (!includeHidden && entry.name.startsWith('.')) {
        continue;
      }

      const fullPath = path.join(
        directory,
        entry.name,
      );

      const stat = await fs.stat(fullPath);

      const info: FileInfo = {
        name: entry.name,
        path: fullPath,
        extension: path.extname(entry.name),
        size: stat.size,
        createdAt: stat.birthtime,
        modifiedAt: stat.mtime,
        isFile: stat.isFile(),
        isDirectory: stat.isDirectory(),
      };

      let include = true;

      if (filesOnly && !info.isFile) {
        include = false;
      }

      if (directoriesOnly && !info.isDirectory) {
        include = false;
      }

      if (
        extensions.length &&
        info.isFile &&
        !extensions.includes(info.extension.toLowerCase())
      ) {
        include = false;
      }

      if (include) {
        result.push(info);
      }

      if (recursive && info.isDirectory) {
        result.push(
          ...(await this.walk(
            fullPath,
            recursive,
            filesOnly,
            directoriesOnly,
            includeHidden,
            extensions,
          )),
        );
      }

    }

    return result;
  }

}