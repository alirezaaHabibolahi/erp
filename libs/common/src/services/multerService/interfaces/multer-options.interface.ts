import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

export interface MulterServiceOptions {
  
  /**
   * Upload destination.
   * Ignored when using memory storage.
   */
  destination?: string;

  /**
   * Maximum file size in bytes.
   * Default: 20MB
   */
  maxFileSize?: number;

  /**
   * Maximum number of files.
   */
  maxFiles?: number;

  /**
   * Allowed mime types.
   */
  mimeTypes?: string[];

  /**
   * Allowed extensions.
   */
  extensions?: string[];

  /**
   * Save in memory instead of disk.
   */
  memory?: boolean;

  /**
   * Preserve original filename.
   */
  preserveFileName?: boolean;

  /**
   * Optional filename prefix.
   */
  fileNamePrefix?: string;

  /**
   * Optional filename suffix.
   */
  fileNameSuffix?: string;

  /**
   * Generate random filename.
   * Default: true
   */
  randomFileName?: boolean;

  /**
   * Extra multer options.
   */
  multer?: MulterOptions;

}