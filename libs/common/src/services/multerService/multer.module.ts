import { Global, Module } from '@nestjs/common';

import { FileModule } from '@app/common/services';

import { MulterService } from './multer.service';

@Module({
  imports: [
    FileModule,
  ],
  providers: [
    MulterService,
  ],
  exports: [
    MulterService,
  ],
})
export class MulterModule {}