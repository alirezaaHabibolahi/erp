import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { KavenegarProvider } from './providers/kavenegar.provider';
import {SmsProviderFactory} from "./providers/sms.provider-factory";
import {SmsIrProvider} from "./providers/sms-ir.provider";

@Module({
  providers: [SmsService, SmsProviderFactory, SmsIrProvider, KavenegarProvider],
  exports: [SmsService,SmsProviderFactory, SmsIrProvider, KavenegarProvider],
})
export class SmsModule {}
