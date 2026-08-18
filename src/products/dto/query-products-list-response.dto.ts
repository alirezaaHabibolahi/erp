// dto/product-response.dto.ts
import { Expose, Transform } from 'class-transformer';
import * as PersianDate from 'persian-date';

export class ProductsListResponseDto {
  @Expose()
  _id: string;

  @Expose()
  DescriptionOfID: string;

  @Expose()
  ID: string;

  @Expose()
  Vat: number;

  @Expose()
  Taxable: string;

  @Expose()
  @Transform(({ value }) => value ? new PersianDate(value).format('YYYY/MM/DD') : null)
  RunDate: string;

  @Expose()
  @Transform(({ value }) => value ? new PersianDate(value).format('YYYY/MM/DD') : null)
  ExpirationDate: string;

  @Expose()
  Type: string;

  @Expose()
  @Transform(({ value }) => value ? new PersianDate(value).format('YYYY/MM/DD HH:mm:ss') : null)
  CreateDate: string;

  @Expose()
  @Transform(({ value }) => value ? new PersianDate(value).format('YYYY/MM/DD HH:mm:ss') : null)
  LastEditDate: string;

  @Expose()
  total: number;

  @Expose()
  page: number;

  @Expose()
  limit: number;

  @Expose()
  totalPages: number;
}