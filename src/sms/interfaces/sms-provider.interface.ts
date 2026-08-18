export interface SmsPayload {
    to: string;
    message: string;
    templateId?: number;
    token?:string;
    params?: Record<string, any>[];
    options?: Record<string, any>
}

export interface SmsProvider {
    sendSms(payload: SmsPayload): Promise<any>;
}
