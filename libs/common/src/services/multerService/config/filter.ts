import { FILE_TYPES } from './file-types.config';

const allowed = Object.values(FILE_TYPES)
  .flatMap(x => x.mimeTypes);

export function globalFileFilter(
  req: any,
  file: Express.Multer.File,
  cb: any,
) {

  if (allowed.includes(file.mimetype)) {
    return cb(null, true);
  }

  cb(new Error('Unsupported file type.'), false);

}