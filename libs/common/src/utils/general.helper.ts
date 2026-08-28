import { randomInt } from 'node:crypto';

export class GeneralHelper {
  static defaultLimit = 10;
  static defaultSkip = 0;
  static defaultSort: 1 | -1 = -1;

  static generateOtp(length = 5): string {
    const digits = Math.max(4, Math.min(length, 10));
    const min = 10 ** (digits - 1);
    const max = 10 ** digits;

    return String(randomInt(min, max));
  }

  static generateOtpExpiration(minutes = 2): Date {
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + minutes);
    return expireAt;
  }

  static objectToString(str: string): string {
    return str.toString();
  }

  static validateLimit(filter: any): number {
    return filter?.limit ? Number(filter.limit) : this.defaultLimit;
  }

  static validateSkip(filter: any): number {
    const effectiveLimit = filter?.limit
      ? Number(filter.limit)
      : this.defaultLimit;
    return filter?.skip
      ? effectiveLimit * Number(filter.skip)
      : this.defaultSkip;
  }

  static validateSort(filter: any): 1 | -1 {
    return filter?.sort ? (!!filter.sort ? 1 : -1) : this.defaultSort;
  }

  static validateSkipLimitSort(filter: any): {
    skip: number;
    limit: number;
    sort: 1 | -1;
  } {
    const limit = this.validateLimit(filter);
    const skip = this.validateSkip(filter);
    const sort: 1 | -1 = this.validateSort(filter);

    return { limit, skip, sort };
  }
}
