import { extname } from 'path';
import { randomUUID } from 'crypto';

export interface GenerateFileNameOptions {
  originalName: string;
  preserveOriginalName?: boolean;
  prefix?: string;
  suffix?: string;
}

export class FileNameUtil {
  /**
   * Generate a safe filename.
   */
  static generate(options: GenerateFileNameOptions): string {
    const extension = extname(options.originalName);

    let name: string;

    if (options.preserveOriginalName) {
      name = this.sanitize(options.originalName.replace(extension, ''));
    } else {
      name = randomUUID();
    }

    if (options.prefix) {
      name = `${options.prefix}_${name}`;
    }

    if (options.suffix) {
      name = `${name}_${options.suffix}`;
    }

    return `${name}${extension.toLowerCase()}`;
  }

  /**
   * Remove invalid filename characters.
   */
  static sanitize(value: string): string {
    return value
      .trim()
      .split('')
      .filter((character) => character.charCodeAt(0) > 31)
      .join('')
      .replace(/[<>:"/\\|?*]/g, '')
      .replace(/\s+/g, '_')
      .replace(/_+/g, '_');
  }
}
