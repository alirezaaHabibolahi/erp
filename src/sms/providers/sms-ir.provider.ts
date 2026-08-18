import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import {SmsPayload, SmsProvider} from "../interfaces/sms-provider.interface";

@Injectable()
export class SmsIrProvider implements SmsProvider {
    private readonly logger = new Logger(SmsIrProvider.name);
    private readonly apiKey: string;
    private readonly baseUrl = 'https://api.sms.ir/v1/send/verify';

    constructor() {
        this.apiKey = process.env.SMS_IR_API_KEY!;
    }

    async sendSms(payload: SmsPayload): Promise<any> {
        try {
            const body = {
                mobile: payload.to,
                templateId: payload.templateId,
                parameters: payload.params ?? [],
            };

            const response = await axios.post(this.baseUrl, body, {
                headers: {
                    'x-api-key': this.apiKey,
                    'Content-Type': 'application/json',
                    'Accept': 'text/plain'
                },
            });

            if (response.data.status !== 1) {
                throw new Error(`SMS.ir error: ${response.data.message}`);
            }

            this.logger.log(`SMS sent to ${payload.to}`);
            return response.data;
        } catch (error: any) {
            this.logger.error(`Failed to send SMS: ${error.message}`);
            throw error;
        }
    }
}
