import { en } from './en';
import { fa } from './fa';

export const messages = {
  en,
  fa,
} as const;

export type LanguageCode = keyof typeof messages;

export const DEFAULT_LANGUAGE: LanguageCode = 'en';

export const SUPPORTED_LANGUAGES = Object.keys(messages) as LanguageCode[];

export const isSupportedLanguage = (value: string): value is LanguageCode =>
  SUPPORTED_LANGUAGES.includes(value as LanguageCode);

export const normalizeLanguage = (
  value?: string | null,
  fallback: LanguageCode = DEFAULT_LANGUAGE,
): LanguageCode => {
  if (!value) {
    return fallback;
  }

  const normalized = value.trim().toLowerCase().split('-')[0];

  return isSupportedLanguage(normalized) ? normalized : fallback;
};
