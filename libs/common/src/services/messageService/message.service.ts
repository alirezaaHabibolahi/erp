import { Injectable } from '@nestjs/common';
import {
  DEFAULT_LANGUAGE,
  LanguageCode,
  messages,
} from '@app/common/constants/messages/select-language';
import { RequestContext } from '@app/common/context/request-context';

type MessageParams = Record<string, string | number | boolean>;

const getNestedValue = (
  source: Record<string, unknown>,
  key: string,
): unknown => {
  const parts = key.split('.');
  let value: unknown = source;

  for (const part of parts) {
    if (
      value &&
      typeof value === 'object' &&
      Object.prototype.hasOwnProperty.call(value, part)
    ) {
      value = (value as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }

  return value;
};

@Injectable()
export class MessageService {
  get(key: string, lang?: LanguageCode, params?: MessageParams): string {
    const currentLang = lang || RequestContext.getLang();
    const value =
      getNestedValue(messages[currentLang], key) ??
      getNestedValue(messages[DEFAULT_LANGUAGE], key);

    if (typeof value !== 'string') {
      return key;
    }

    return this.interpolate(value, params);
  }

  has(key: string, lang?: LanguageCode): boolean {
    const currentLang = lang || RequestContext.getLang();

    return (
      typeof getNestedValue(messages[currentLang], key) === 'string' ||
      typeof getNestedValue(messages[DEFAULT_LANGUAGE], key) === 'string'
    );
  }

  translate(value: string, lang?: LanguageCode): string;
  translate(value: string[], lang?: LanguageCode): string[];
  translate(value: undefined, lang?: LanguageCode): undefined;
  translate(
    value: string | string[] | undefined,
    lang?: LanguageCode,
  ): string | string[] | undefined;
  translate(
    value: string | string[] | undefined,
    lang?: LanguageCode,
  ): string | string[] | undefined {
    if (Array.isArray(value)) {
      return value.map((item) => this.translateOne(item, lang));
    }

    return value ? this.translateOne(value, lang) : value;
  }

  private translateOne(value: string, lang?: LanguageCode): string {
    return this.has(value, lang) ? this.get(value, lang) : value;
  }

  private interpolate(message: string, params?: MessageParams): string {
    if (!params) {
      return message;
    }

    return message.replace(/\{(\w+)}/g, (match, key: string) =>
      Object.prototype.hasOwnProperty.call(params, key)
        ? String(params[key])
        : match,
    );
  }
}
