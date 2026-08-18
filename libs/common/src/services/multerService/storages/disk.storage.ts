import { diskStorage } from 'multer';
import { StorageEngine } from 'multer';

import { FileService } from '@app/common/services';
import { MulterServiceOptions } from '@app/common/services';
import { FileNameUtil } from '@app/common/services';

export class DiskStorageFactory {

  static create(
    fileService: FileService,
    options: MulterServiceOptions = {},
  ): StorageEngine {

    return diskStorage({

      destination: async (
        req,
        file,
        callback,
      ) => {

        try {

          const destination =
            options.destination ?? 'uploads';

          await fileService.ensureDirectory(
            destination,
          );

          callback(
            null,
            destination,
          );

        } catch (error) {

          callback(
            error as Error,
            '',
          );

        }

      },

      filename: (
        req,
        file,
        callback,
      ) => {

        const filename =
          FileNameUtil.generate({

            originalName:
            file.originalname,

            preserveOriginalName:
            options.preserveFileName,

            prefix:
            options.fileNamePrefix,

            suffix:
            options.fileNameSuffix,

          });

        callback(
          null,
          filename,
        );

      },

    });

  }

}