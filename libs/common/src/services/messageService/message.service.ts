import { Injectable } from '@nestjs/common';
import { messages, LanguageCode } from '@app/common/index';
import { RequestContext } from '@app/common/context/request-context';

@Injectable()
export class MessageService {
    get(key: string, lang?: LanguageCode): string {
        const currentLang = lang || RequestContext.getLang();
        const parts = key.split('.');
        let value: any = messages[currentLang];

        for (const part of parts) {
            if (value && Object.prototype.hasOwnProperty.call(value, part)) {
                value = value[part];
            } else {
                return `${key}`;
            }
        }

        return typeof value === 'string'
            ? value
            : `[invalid translation type: ${currentLang}.${key}]`;
    }
}
