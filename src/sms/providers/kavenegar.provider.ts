import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {SmsPayload, SmsProvider} from "../interfaces/sms-provider.interface";

@Injectable()
export class KavenegarProvider implements SmsProvider {
    private readonly logger = new Logger(KavenegarProvider.name);
    private readonly apiKey = process.env.KAVENEGAR_API_KEY!;
    private readonly baseUrl = `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json`;

    async sendSms(payload: SmsPayload): Promise<any> {
        try {
            const params = new URLSearchParams({
                receptor: payload.to,
                token: payload.options?.token,
                template: payload.options?.template,
            });

            const response = await axios.get(`${this.baseUrl}?${params.toString()}`);
            this.logger.log(`SMS sent to ${payload.to}`);
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to send SMS: ${error.message}`);
            throw error;
        }
    }
}
