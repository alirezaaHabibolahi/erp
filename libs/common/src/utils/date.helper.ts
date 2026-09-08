import moment from 'jalali-moment';
import PersianDate from 'persian-date';

const EXCEL_EPOCH_OFFSET_DAYS = 25569;
const MS_PER_DAY = 86400000;
const DEFAULT_DURATION_MS = 7 * MS_PER_DAY;
const DURATION_MULTIPLIERS: Record<string, number> = {
  ms: 1,
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: MS_PER_DAY,
};

export class DateHelper {
  static now(
    locale: 'en' | 'fa' = 'en',
    format = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    return moment().locale(locale).format(format);
  }

  static convert(
    date: string | Date,
    from: 'en' | 'fa',
    to: 'en' | 'fa',
    format = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    return moment(date, undefined, from).locale(to).format(format);
  }

  static GregorianToShamsi(timestamp: any) {
    return timestamp ? new PersianDate(timestamp).format('l HH:mm') : null;
  }

  static extractHours(startTime?: string | Date, endTime?: string | Date) {
    const startHour = startTime
      ? new Date(startTime).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Tehran',
        })
      : null;
    const endHour = endTime
      ? new Date(endTime).toLocaleTimeString('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Tehran',
        })
      : null;
    return {
      startHour,
      endHour,
    };
  }

  static isJalali(dateString: string): boolean {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
      return false;
    }
    const year = parseInt(dateString.split('-')[0], 10);
    return year >= 1300 && year <= 1600;
  }

  static format(
    date: string | Date,
    locale: 'en' | 'fa' = 'en',
    format = 'YYYY-MM-DD HH:mm:ss',
  ): string {
    return moment(date).locale(locale).format(format);
  }

  static parse(date: string, locale: 'en' | 'fa' = 'en') {
    const parsed = moment(date, undefined, locale);
    return parsed.isValid() ? parsed : null;
  }

  static add(
    date: string | Date,
    amount: number,
    unit: moment.unitOfTime.DurationConstructor,
  ): Date {
    return moment(date).add(amount, unit).toDate();
  }

  static subtract(
    date: string | Date,
    amount: number,
    unit: moment.unitOfTime.DurationConstructor,
  ): Date {
    return moment(date).subtract(amount, unit).toDate();
  }

  static isBefore(date1: string | Date, date2: string | Date): boolean {
    return moment(date1).isBefore(moment(date2));
  }

  static isAfter(date1: string | Date, date2: string | Date): boolean {
    return moment(date1).isAfter(moment(date2));
  }

  static isSame(
    date1: string | Date,
    date2: string | Date,
    unit: moment.unitOfTime.StartOf = 'second',
  ): boolean {
    return moment(date1).isSame(moment(date2), unit);
  }

  static diff(
    date1: string | Date,
    date2: string | Date,
    unit: moment.unitOfTime.Diff = 'days',
  ): number {
    return moment(date1).diff(moment(date2), unit);
  }

  static isValid(date: string | Date, locale: 'en' | 'fa' = 'en'): boolean {
    return moment(date, undefined, locale).isValid();
  }

  static range(
    date: string | Date,
    type: 'start' | 'end',
    unit: moment.unitOfTime.StartOf = 'day',
  ): Date {
    const m = moment(date);
    return type === 'start' ? m.startOf(unit).toDate() : m.endOf(unit).toDate();
  }

  static fromNow(date: string | Date, locale: 'en' | 'fa' = 'en'): string {
    return moment(date).locale(locale).fromNow();
  }

  static createExpiration(minutes = 2): Date {
    return moment().add(minutes, 'minutes').toDate();
  }

  static parseDurationToMilliseconds(
    value: string,
    fallbackMs = DEFAULT_DURATION_MS,
  ): number {
    const match = /^(\d+)\s*(ms|s|m|h|d)$/i.exec(value.trim());

    if (!match) {
      return fallbackMs;
    }

    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = DURATION_MULTIPLIERS[unit];

    return multiplier ? amount * multiplier : fallbackMs;
  }

  static expirationFromNow(
    duration: string,
    fallbackMs = DEFAULT_DURATION_MS,
  ): Date {
    return new Date(
      Date.now() + this.parseDurationToMilliseconds(duration, fallbackMs),
    );
  }

  static toTimestamp(date: string | Date): number {
    return moment(date).valueOf();
  }

  static fromTimestamp(timestamp: number): Date {
    return moment(timestamp).toDate();
  }

  static toPersianReadable(date: string | Date): string {
    return moment(date).locale('fa').format('dddd، D MMMM YYYY');
  }

  static toISO(date: string | Date): string {
    return moment(date).utc().toISOString();
  }

  static diffDetailed(
    date1: string | Date,
    date2: string | Date,
  ): {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } {
    const m1 = moment(date1);
    const m2 = moment(date2);
    const diffMs = Math.abs(m1.diff(m2));

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs / (1000 * 60 * 60)) % 24);
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);
    const seconds = Math.floor((diffMs / 1000) % 60);

    return { days, hours, minutes, seconds };
  }

  static toTimezone(
    date: string | Date,
    timezone: string,
    format = 'YYYY-MM-DD HH:mm:ss',
  ) {
    // jalali-moment doesn't support IANA tz directly; use moment-tz if needed
    // Here we simulate a simple offset change if needed
    //  return moment(date).utcOffset(moment().tz(timezone).utcOffset()).format(format);
  }

  static isExpired(date: string | Date): boolean {
    return moment().isAfter(moment(date));
  }

  static daysInJalaliMonth(year: number, month: number): number {
    return moment.jDaysInMonth(year, month - 1);
  }

  static countdownTo(date: string | Date, locale: 'en' | 'fa' = 'en'): string {
    const diff = this.diffDetailed(date, new Date());
    if (moment(date).isBefore(moment()))
      return locale === 'fa' ? 'منقضی شده' : 'Expired';

    if (locale === 'fa')
      return `${diff.days} روز ${diff.hours} ساعت ${diff.minutes} دقیقه مانده`;
    return `${diff.days} days ${diff.hours} hours ${diff.minutes} minutes left`;
  }

  static jalaliToGregorian(
    jy: number,
    jm: number,
    jd: number,
  ): [number, number, number] {
    const y = jy + 1595;
    let days =
      -355668 +
      365 * y +
      Math.floor(y / 33) * 8 +
      Math.floor(((y % 33) + 3) / 4) +
      jd +
      (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186);

    let gy = 400 * Math.floor(days / 146097);
    days %= 146097;

    if (days > 36524) {
      gy += 100 * Math.floor(--days / 36524);
      days %= 36524;
      if (days >= 365) days++;
    }

    gy += 4 * Math.floor(days / 1461);
    days %= 1461;

    if (days > 365) {
      gy += Math.floor((days - 1) / 365);
      days = (days - 1) % 365;
    }

    let gd = days + 1;
    const isLeap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0;
    const monthDays = [
      0,
      31,
      isLeap ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31,
    ];

    let gm = 1;
    for (; gm <= 12 && gd > monthDays[gm]; gm++) {
      gd -= monthDays[gm];
    }

    return [gy, gm, gd];
  }

  static createDateParser() {
    const stringCache = new Map<string, Date | null>();
    const serialCache = new Map<number, Date>();

    // Use arrow function to capture 'this' from the class
    const parseDateStringUncached = (trimmed: string): Date | null => {
      const match = trimmed.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);

      if (!match) {
        const parsed = new Date(trimmed);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      const year = Number(match[1]);
      const month = Number(match[2]);
      const day = Number(match[3]);

      if (year >= 1300 && year <= 1600) {
        const [gy, gm, gd] = this.jalaliToGregorian(year, month, day);
        const date = new Date(Date.UTC(gy, gm - 1, gd));
        return isNaN(date.getTime()) ? null : date;
      }

      const date = new Date(Date.UTC(year, month - 1, day));
      return isNaN(date.getTime()) ? null : date;
    };

    const parseDate = (value: unknown): Date | null => {
      if (value === null || value === undefined || value === '') return null;
      if (value instanceof Date) return value;

      if (typeof value === 'number') {
        const serial = Math.round(value);
        let cached = serialCache.get(serial);
        if (cached === undefined) {
          cached = new Date((serial - EXCEL_EPOCH_OFFSET_DAYS) * MS_PER_DAY);
          serialCache.set(serial, cached);
        }
        return cached;
      }

      if (typeof value !== 'string') return null;

      const trimmed = value.trim();
      if (!trimmed) return null;

      const cached = stringCache.get(trimmed);
      if (cached !== undefined) return cached;

      const result = parseDateStringUncached(trimmed);
      stringCache.set(trimmed, result);
      return result;
    };

    return {
      parseDate,
      clear: () => {
        stringCache.clear();
        serialCache.clear();
      },
    };
  }

  static convertJalaliToGregorian(date: string): Date {
    const m = moment.from(date, 'fa', 'YYYY-MM-DD HH:mm:ss');
    return new Date(Date.UTC(m.year(), m.month(), m.date(), 0, 0, 0, 0));
  }
}
