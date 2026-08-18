import sharp from 'sharp';

export interface ConvertOptions {

  /**
   * Output image format.
   */
  format:
    | 'jpeg'
    | 'png'
    | 'webp'
    | 'gif'
    | 'avif'
    | 'tiff';

  /**
   * Image quality.
   * Default: 80
   */
  quality?: number;

}