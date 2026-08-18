import { IBaseSchema, MDocument, ObjectId } from '@/types/Base/BaseTypes';

export interface IUser extends IBaseSchema {
  phone: string;
  username?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  otp_code?: string;
  expire_otp_code_date?: Date;
  password?: string;
  is_verified: boolean;
  is_admin: boolean
  role: ObjectId;
  is_active: boolean;
  settings?: Record<string, any>;
  deletedAt?: Date | null;
}

export interface IUserDoc extends IUser {}
