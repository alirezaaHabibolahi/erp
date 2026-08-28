import { randomInt as secureRandomInt } from 'node:crypto';

export class NumberHelper {
  static toCurrency(value: number, locale = 'en-US', currency = 'USD'): string {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
    }).format(value);
  }

  static clamp(num: number, min: number, max: number): number {
    return Math.min(Math.max(num, min), max);
  }

  static randomInt(min: number, max: number): number {
    return secureRandomInt(min, max + 1);
  }
}
