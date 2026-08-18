import { en } from './en';
import { fa } from './fa';

export const messages = {
    en,
    fa,
};

export type LanguageCode = keyof typeof messages;
