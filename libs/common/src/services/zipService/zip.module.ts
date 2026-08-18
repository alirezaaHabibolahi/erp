import { Global, Module } from '@nestjs/common';

import { ZipReaderService} from './helpers/zip-reader.service';
import {ZipWriterService} from "./helpers/zip-writer.service"
import {ZipService} from "./zip.service"

@Module({
  providers: [
    ZipService,
    ZipReaderService,
    ZipWriterService,
  ],
  exports: [
    ZipService,
  ],
})
export class ZipModule {}