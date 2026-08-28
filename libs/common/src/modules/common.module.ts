import { Module, Global } from '@nestjs/common';
import {
  ApiModule,
  DownloadModule,
  ExcelModule,
  MessageService,
  ZipModule,
} from '@app/common';
import { SmsModule } from '../../../../src/sms/sms.module';
import { RedisModule } from '@app/common/redis/redis.module';
import { SmsService } from '../../../../src/sms/sms.service';
import { FileModule } from '@app/common/services/fileService/file.module';
import { MulterModule } from '@app/common/services/multerService/multer.module';
import { ImageModule } from '@app/common/services/imageService/image.module';

@Global()
@Module({
  imports: [
    RedisModule,
    SmsModule,
    FileModule,
    ApiModule,
    ZipModule,
    ExcelModule,
    MulterModule,
    ImageModule,
    DownloadModule,
  ],
  providers: [MessageService, SmsService],
  exports: [
    RedisModule,
    FileModule,
    ApiModule,
    SmsModule,
    ZipModule,
    ExcelModule,
    MulterModule,
    ImageModule,
    DownloadModule,
    MessageService,
  ],
})
export class CommonModule {}
