import { Global, Module } from '@nestjs/common';

import { FileModule } from '@app/common/services';

import { ImageService } from './image.service';

@Module({
  imports: [
    FileModule,
  ],
  providers: [
    ImageService,
  ],
  exports: [
    ImageService,
  ],
})
export class ImageModule {}