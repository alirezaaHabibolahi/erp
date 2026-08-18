import type { Metadata } from 'sharp';

export interface ImageResult {

  /**
   * Output image buffer.
   */
  buffer: Buffer;

  /**
   * Image metadata.
   */
  metadata: Metadata;

}