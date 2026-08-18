import { Writable } from 'stream';

export interface ExcelSaveOptions {

  /**
   * Save workbook to disk.
   */
  path?: string;

  /**
   * Write workbook to stream.
   */
  stream?: Writable;

}