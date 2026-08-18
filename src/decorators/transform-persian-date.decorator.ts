import { Transform } from 'class-transformer';
import * as PersianDate from 'persian-date';

export function TransformPersianDate(format: string = 'YYYY/MM/DD') {
  return Transform(({ value }) => {
    if (!value) return null;
    try {
      const persianDate = new PersianDate(value);
      return persianDate.format(format);
    } catch (error) {
      return value;
    }
  });
}