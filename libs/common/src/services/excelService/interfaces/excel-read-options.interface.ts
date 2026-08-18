import { Readable } from 'stream';

export interface ExcelReadOptions {

  /**
   * Read workbook from disk.
   */
  path?: string;

  /**
   * Read workbook from memory.
   */
  buffer?: Buffer;

  /**
   * Read workbook from stream.
   */
  stream?: Readable;

}