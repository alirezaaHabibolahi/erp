import { IBaseSchema, MDocument, ObjectId } from '@/types/Base/BaseTypes';


export interface IRole extends IBaseSchema{
  fa_name: string;
  en_name: string;
  accesses: ObjectId[];
}

export interface IRoleDoc extends IRole {}