import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { RequestContext } from '@app/common/context/request-context';
import {
  DEFAULT_LANGUAGE,
  isSupportedLanguage,
  LanguageCode,
} from '@app/common/constants/messages/select-language';

type LocalizedRequest = Request & {
  lang?: LanguageCode;
  requestId?: string;
};

const firstHeaderValue = (
  value: string | string[] | undefined,
): string | undefined => (Array.isArray(value) ? value[0] : value);

const firstQueryValue = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return typeof value[0] === 'string' ? value[0] : undefined;
  }

  return typeof value === 'string' ? value : undefined;
};

const parseAcceptLanguage = (value?: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  return value
    .split(',')
    .map((part) => {
      const [language, ...params] = part.trim().split(';');
      const qParam = params.find((param) => param.trim().startsWith('q='));
      const quality = qParam ? Number(qParam.trim().slice(2)) : 1;

      return {
        language,
        quality: Number.isFinite(quality) ? quality : 0,
      };
    })
    .filter((part) => part.language)
    .sort((a, b) => b.quality - a.quality)[0]?.language;
};

const detectSupportedLanguage = (value?: string): LanguageCode | undefined => {
  if (!value) {
    return undefined;
  }

  const normalized = value.trim().toLowerCase().split('-')[0];

  return isSupportedLanguage(normalized) ? normalized : undefined;
};

@Injectable()
export class LanguageMiddleware implements NestMiddleware {
  use(req: LocalizedRequest, res: Response, next: NextFunction): void {
    const languageCandidates = [
      firstQueryValue(req.query.lang),
      firstHeaderValue(req.headers['x-language']),
      firstHeaderValue(req.headers['x-lang']),
      parseAcceptLanguage(firstHeaderValue(req.headers['accept-language'])),
    ];
    const lang =
      languageCandidates.reduce<LanguageCode | undefined>(
        (selected, candidate) => selected ?? detectSupportedLanguage(candidate),
        undefined,
      ) ?? DEFAULT_LANGUAGE;

    const requestId =
      firstHeaderValue(req.headers['x-request-id'])?.trim() || randomUUID();

    req.lang = lang;
    req.requestId = requestId;

    res.setHeader('Content-Language', lang);
    res.setHeader('X-Request-Id', requestId);

    RequestContext.run({ lang, requestId }, next);
  }
}
