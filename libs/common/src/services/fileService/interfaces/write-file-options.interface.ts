export interface WriteFileOptions {
  path: string;

  data: string | Buffer;

  encoding?: BufferEncoding;

  overwrite?: boolean;

  createDirectory?: boolean;
}