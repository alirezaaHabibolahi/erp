import { IBaseSchema } from '@/types/Base/BaseTypes';

export interface IProduct extends IBaseSchema{
  ID: string;
  DescriptionOfID: string;
  VAT: number;
  Taxable?: string;
  RunDate: Date;
  ExpirationDate: Date | null;
  Type: string;
  CreateDate: Date;
  LastEditDate: Date;
  importBatch: string;
  importDate: Date;
  sourceFile: string;
  isActive: boolean;
  activatedAt?: Date | null;
  deactivatedAt: Date | null;
  deletedAt: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IProductDoc extends IProduct{}