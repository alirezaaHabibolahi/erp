import { Injectable } from '@nestjs/common';
import {SmsIrProvider} from "./sms-ir.provider";
import {KavenegarProvider} from "./kavenegar.provider";
import {SmsProvider} from "../interfaces/sms-provider.interface";
import { generalConfig } from '../../config/general';

@Injectable()
export class SmsProviderFactory {
    constructor(
        private readonly smsIrProvider: SmsIrProvider,
        private readonly kavenegarProvider: KavenegarProvider,
    ) {}

    getProvider(providerName?: string): SmsProvider {
        const provider = providerName || generalConfig().SMS_PROVIDER;

        switch (provider.toLowerCase()) {
            case 'smsir':
                return this.smsIrProvider;
            case 'kavenegar':
                return this.kavenegarProvider;
            default:
                throw new Error(`Unsupported SMS provider: ${provider}`);
        }
    }
}
