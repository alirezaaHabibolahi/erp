import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { SmsPayload, SmsProvider } from '../interfaces/sms-provider.interface';

@Injectable()
export class KavenegarProvider implements SmsProvider {
  private readonly logger = new Logger(KavenegarProvider.name);
  private readonly apiKey = process.env.KAVENEGAR_API_KEY?.trim();

  async sendSms(payload: SmsPayload): Promise<unknown> {
    const token = payload.options?.token;
    const template = payload.options?.template;

    if (!this.apiKey) {
      throw new Error(
        'KAVENEGAR_API_KEY is required for the kavenegar provider.',
      );
    }

    if (!token || !template) {
      throw new Error(
        'SMS reset token and template are required for the kavenegar provider.',
      );
    }

    try {
      const params = new URLSearchParams({
        receptor: payload.to,
        token,
        template,
      });
      const baseUrl = `https://api.kavenegar.com/v1/${this.apiKey}/verify/lookup.json`;
      const response = await axios.get(`${baseUrl}?${params.toString()}`);

      this.logger.log('SMS sent successfully through Kavenegar.');
      return response.data;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`Kavenegar delivery failed: ${message}`);
      throw error;
    }
  }
}
