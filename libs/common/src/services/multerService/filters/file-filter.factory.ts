import { Request } from 'express';
import { FileFilterCallback } from 'multer';
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

type FileFilter = (
  req: Request,
  file: Express.Multer.File,
  callback: FileFilterCallback,
) => void;

export class FileFilterFactory {
  static create(options: FileFilterOptions): FileFilter {
    return (
      req: Request,
      file: Express.Multer.File,
      callback: FileFilterCallback,
    ): void => {
      const extension = extname(file.originalname).toLowerCase();

      if (
        options.extensions &&
        options.extensions.length > 0 &&
        !options.extensions.includes(extension)
      ) {
        callback(
          new Error(`File extension "${extension}" is not allowed.`),
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
        );
        return;
      }

      callback(null, true);
    };
  }
}