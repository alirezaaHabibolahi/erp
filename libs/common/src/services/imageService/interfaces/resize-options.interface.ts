import type { ResizeOptions as SharpResizeOptions } from 'sharp';

export interface ResizeOptions {

  width?: number;

  height?: number;

  fit?: SharpResizeOptions['fit'];

  withoutEnlargement?: boolean;

  withoutReduction?: boolean;

}