import { Readable } from 'stream';

export interface ImageInput {

  /**
   * Image file path.
   */
  path?: string;

  /**
   * Image buffer.
   */
  buffer?: Buffer;

  /**
   * Image stream.
   */
  stream?: Readable;

}