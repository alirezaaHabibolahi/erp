
export class ProductResponseDto {
  code: string;

  description: string;

  vatRate: number;

  runDate: string;

  createDate: string;

  expirationDate: string | null;

  warning: string | null;
}