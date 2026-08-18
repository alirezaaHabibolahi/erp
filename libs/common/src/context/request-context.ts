import { AsyncLocalStorage } from 'async_hooks';
import { LanguageCode } from '@app/common';

interface RequestStore {
    lang: LanguageCode;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestStore>();

export class RequestContext {
    static run(lang: LanguageCode, callback: () => void) {
        asyncLocalStorage.run({ lang }, callback);
    }

    static getLang(): LanguageCode {
        return asyncLocalStorage.getStore()?.lang || 'en';
    }
}
