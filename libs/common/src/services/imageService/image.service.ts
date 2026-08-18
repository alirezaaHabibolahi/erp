import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import sharp, { Sharp } from 'sharp';

import { CropOptions, ImageInput } from '@app/common/services';
import { ImageResult } from '@app/common/services';
import { ResizeOptions } from '@app/common/services';
import { ConvertOptions } from '@app/common/services';

@Injectable()
export class ImageService {

  private createSharp(
    input: ImageInput,
  ): Sharp {

    if (input.buffer) {
      return sharp(input.buffer);
    }

    if (input.path) {
      return sharp(input.path);
    }

    throw new BadRequestException(
      'No image source provided.',
    );

  }

  async metadata(
    input: ImageInput,
  ) {

    return this.createSharp(input).metadata();

  }

  async resize(
    input: ImageInput,
    options: ResizeOptions,
  ): Promise<ImageResult> {

    const image = this.createSharp(input);

    const resized = image.resize({

      width: options.width,

      height: options.height,

      fit: options.fit,

      withoutEnlargement:
      options.withoutEnlargement,

      withoutReduction:
      options.withoutReduction,

    });

    return this.buildResult(
      resized,
    );

  }

  async thumbnail(
    input: ImageInput,
    size = 250,
  ): Promise<ImageResult> {

    const image =
      this.createSharp(input);

    return this.buildResult(

      image.resize({

        width: size,

        height: size,

        fit: 'cover',

        withoutEnlargement: true,

      }),

    );

  }

  async convert(
    input: ImageInput,
    options: ConvertOptions,
  ): Promise<ImageResult> {

    let image = this.createSharp(input);

    switch (options.format) {

      case 'jpeg':
        image = image.jpeg({
          quality: options.quality ?? 80,
        });
        break;

      case 'png':
        image = image.png();
        break;

      case 'webp':
        image = image.webp({
          quality: options.quality ?? 80,
        });
        break;

      case 'gif':
        image = image.gif();
        break;

      case 'avif':
        image = image.avif({
          quality: options.quality ?? 80,
        });
        break;

      case 'tiff':
        image = image.tiff({
          quality: options.quality ?? 80,
        });
        break;

    }

    return this.buildResult(image);

  }

  async rotate(
    input: ImageInput,
    angle = 90,
  ): Promise<ImageResult> {

    return this.buildResult(
      this.createSharp(input).rotate(angle),
    );

  }

  async flip(
    input: ImageInput,
  ): Promise<ImageResult> {

    return this.buildResult(
      this.createSharp(input).flip(),
    );

  }

  async flop(
    input: ImageInput,
  ): Promise<ImageResult> {

    return this.buildResult(
      this.createSharp(input).flop(),
    );

  }

  async crop(
    input: ImageInput,
    options: CropOptions,
  ): Promise<ImageResult> {

    return this.buildResult(

      this.createSharp(input).extract({

        left: options.left,

        top: options.top,

        width: options.width,

        height: options.height,

      }),

    );

  }

  private async buildResult(
    image: Sharp,
  ): Promise<ImageResult> {

    const buffer = await image.toBuffer();

    return {

      buffer,

      metadata: await sharp(buffer).metadata(),

    };

  }

}