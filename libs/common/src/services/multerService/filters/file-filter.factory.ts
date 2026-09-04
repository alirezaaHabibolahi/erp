import type { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { extname } from 'path';

export interface FileFilterOptions {
  /**
   * Allowed mime types.
   */
  mimeTypes?: string[];

  /**
   * Allowed file extensions.
   * Example: ['.jpg', '.png']
   */
  extensions?: string[];
}

type FileFilter = NonNullable<MulterOptions['fileFilter']>;

export class FileFilterFactory {
  static create(options: FileFilterOptions): FileFilter {
    return (_request, file, callback): void => {
      const extension = extname(file.originalname).toLowerCase();

      if (
        options.extensions &&
        options.extensions.length > 0 &&
        !options.extensions.includes(extension)
      ) {
        callback(
          new Error(`File extension "${extension}" is not allowed.`),
          false,
        );
        return;
      }

      if (
        options.mimeTypes &&
        options.mimeTypes.length > 0 &&
        !options.mimeTypes.includes(file.mimetype)
      ) {
        callback(
          new Error(`Mime type "${file.mimetype}" is not allowed.`),
          false,
        );
        return;
      }

      callback(null, true);
    };
  }
}
