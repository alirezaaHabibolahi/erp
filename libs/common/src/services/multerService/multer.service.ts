import { Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';

import { FileService } from '@app/common/services';
import { MulterServiceOptions } from '@app/common/services';
import { DiskStorageFactory } from '@app/common/services';
import { MemoryStorageFactory } from '@app/common/services';
import { FileFilterFactory } from '@app/common/services';
import { globalStorage} from '@app/common';
import { globalFileFilter } from '@app/common';

@Injectable()
export class MulterService {

  constructor(
    private readonly fileService: FileService,
  ) {}

  /**
   * Generic multer options.
   */
  options(
    options: MulterServiceOptions = {},
  ): MulterOptions {

    return {

      storage: options.memory
        ? MemoryStorageFactory.create()
        : DiskStorageFactory.create(
          this.fileService,
          options,
        ),

      limits: {
        fileSize:
          options.maxFileSize ??
          20 * 1024 * 1024,
        files:
          options.maxFiles ?? 1,
      },

      fileFilter: FileFilterFactory.create({

        mimeTypes:
        options.mimeTypes,

        extensions:
        options.extensions,

      }),

      ...(options.multer ?? {}),

    };

  }

  /**
   * Memory upload.
   */
  memory(
    options: Omit<MulterServiceOptions, 'memory'> = {},
  ): MulterOptions {

    return this.options({
      ...options,
      memory: true,
    });

  }

  /**
   * Disk upload.
   */
  disk(
    options: Omit<MulterServiceOptions, 'memory'> = {}, useGlobal = false
  ): MulterOptions {

    if(useGlobal){
      return {
        storage: globalStorage,
        fileFilter: globalFileFilter,
        limits: {
          fileSize: 50 * 1024 * 1024,
        },
      };
    }else{
      return this.options({
        ...options,
        memory: false,
      });

    }
  }

  /**
   * Image upload.
   */
  image(
    options: Omit<MulterServiceOptions, 'mimeTypes' | 'extensions'> = {},
  ): MulterOptions {

    return this.disk({

      ...options,

      mimeTypes: [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
      ],

      extensions: [
        '.jpg',
        '.jpeg',
        '.png',
        '.gif',
        '.webp',
        '.svg',
      ],

    });

  }

  /**
   * Video upload.
   */
  video(
    options: Omit<MulterServiceOptions, 'mimeTypes' | 'extensions'> = {},
  ): MulterOptions {

    return this.disk({

      ...options,

      mimeTypes: [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
      ],

      extensions: [
        '.mp4',
        '.webm',
        '.mov',
        '.avi',
      ],

    });

  }

  /**
   * Excel upload.
   */
  excel(
    options: Omit<MulterServiceOptions, 'memory' | 'mimeTypes' | 'extensions'> = {},
  ): MulterOptions {

    return this.memory({

      ...options,

      mimeTypes: [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],

      extensions: [
        '.xls',
        '.xlsx',
      ],

    });

  }

  /**
   * ZIP upload.
   */
  zip(
    options: Omit<MulterServiceOptions, 'memory' | 'mimeTypes' | 'extensions'> = {},
  ): MulterOptions {

    return this.memory({

      ...options,

      mimeTypes: [
        'application/zip',
        'application/x-zip-compressed',
      ],

      extensions: [
        '.zip',
      ],

    });

  }

}