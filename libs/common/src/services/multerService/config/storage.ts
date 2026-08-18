import { diskStorage } from 'multer';
import { randomUUID } from 'crypto';
import { extname } from 'path';
import * as fs from 'fs';

import { FILE_TYPES } from './file-types.config';

export const globalStorage = diskStorage({

  destination(req, file, cb) {

    let destination = FILE_TYPES.others.destination;

    for (const config of Object.values(FILE_TYPES)) {
      // @ts-ignore
      if (config.mimeTypes.includes(file.mimetype)) {
        destination = config.destination;
        break;
      }
    }

    fs.mkdirSync(destination, { recursive: true });

    cb(null, destination);

  },

  filename(req, file, cb) {

    const extension = extname(file.originalname);

    const filename =
      `${Date.now()}-${randomUUID()}${extension}`;

    cb(null, filename);

  },

});