import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SmsPayload, SmsProvider } from '../interfaces/sms-provider.interface';

type SmsIrResponse = {
  status: number;
  message?: string;
};

@Injectable()
export class SmsIrProvider implements SmsProvider {
  private readonly logger = new Logger(SmsIrProvider.name);
  private readonly apiKey = process.env.SMS_IR_API_KEY?.trim();
  private readonly baseUrl = 'https://api.sms.ir/v1/send/verify';

  async sendSms(payload: SmsPayload): Promise<unknown> {
    if (!this.apiKey) {
      throw new Error('SMS_IR_API_KEY is required for the smsir provider.');
    }

    if (!payload.templateId) {
      throw new Error(
        'SMS_PASSWORD_RESET_TEMPLATE_ID is required for the smsir provider.',
      );
    }

    try {
      const body = {
        mobile: payload.to,
        templateId: payload.templateId,
        parameters: payload.params ?? [],
      };

      const response = await axios.post<SmsIrResponse>(this.baseUrl, body, {
        headers: {
          'x-api-key': this.apiKey,
          'Content-Type': 'application/json',
          Accept: 'text/plain',
        },
      });

      if (response.data.status !== 1) {
        throw new Error(`SMS.ir error: ${response.data.message ?? 'unknown'}`);
      }

      this.logger.log('SMS sent successfully through SMS.ir.');
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`SMS.ir delivery failed: ${message}`);
      throw error;
    }
  }
}
