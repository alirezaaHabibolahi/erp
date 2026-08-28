import { AsyncLocalStorage } from 'node:async_hooks';
import {
  DEFAULT_LANGUAGE,
  LanguageCode,
} from '@app/common/constants/messages/select-language';

export interface RequestStore {
  lang: LanguageCode;
  requestId: string;
}

const asyncLocalStorage = new AsyncLocalStorage<RequestStore>();

export class RequestContext {
  static run(store: RequestStore, callback: () => void): void {
    asyncLocalStorage.run(store, callback);
  }

  static getStore(): RequestStore | undefined {
    return asyncLocalStorage.getStore();
  }

  static getLang(): LanguageCode {
    return asyncLocalStorage.getStore()?.lang || DEFAULT_LANGUAGE;
  }

  static getRequestId(): string | undefined {
    return asyncLocalStorage.getStore()?.requestId;
  }
}
