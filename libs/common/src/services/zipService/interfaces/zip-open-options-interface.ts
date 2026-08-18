import { Readable } from 'stream';

export interface ZipOpenOptions {

  /**
   * Read zip from disk.
   */
  path?: string;

  /**
   * Read zip from memory.
   */
  buffer?: Buffer;

  /**
   * Read zip from stream.
   */
  stream?: Readable;

}