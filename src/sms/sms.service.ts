import { Injectable } from '@nestjs/common';
import {SmsProviderFactory} from "./providers/sms.provider-factory";
import {SmsPayload} from "./interfaces/sms-provider.interface";

@Injectable()
export class SmsService {
    constructor(private readonly providerFactory: SmsProviderFactory) {}

    async send(payload: SmsPayload, providerName?: string): Promise<any> {
        const provider = this.providerFactory.getProvider(providerName);
        return provider.sendSms(payload);
    }
}
