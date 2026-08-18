import { Module } from '@nestjs/common';
import { FileService } from './file.service';
import {
  DirectoryService,
  FinderService,
  HashService,
  ReaderService,
  TempService,
  WriterService,
} from '@app/common/services/fileService/helpers';

@Module({
  providers: [
    ReaderService,
    WriterService,
    DirectoryService,
    FinderService,
    HashService,
    TempService,
    FileService,
  ],
  exports: [FileService],
})
export class FileModule {}