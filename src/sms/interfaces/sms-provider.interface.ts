export interface SmsPayload {
  to: string;
  message: string;
  templateId?: number;
  params?: Array<{ name: string; value: string }>;
  options?: {
    token?: string;
    template?: string;
  };
}

export interface SmsProvider {
  sendSms(payload: SmsPayload): Promise<unknown>;
}
