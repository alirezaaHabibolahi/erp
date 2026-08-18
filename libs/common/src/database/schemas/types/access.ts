import { IBaseSchema, MDocument } from '@/types/Base/BaseTypes';


export interface IAccess extends IBaseSchema{
  fa_name: string;
  en_name: string;
}

export interface IAccessDoc extends IAccess{}