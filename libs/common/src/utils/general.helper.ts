import Mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

export class GeneralHelper {
  static defaultLimit = 10;
  static defaultSkip = 0;
  static defaultSort : 1 | -1 = -1;
  static generateOtp(length = 5): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min + 1)).toString();
  }

  static generateOtpExpiration(minutes = 2): Date {
    const expireAt = new Date();
    expireAt.setMinutes(expireAt.getMinutes() + minutes);
    return expireAt;
  }

  static generateObjectId(str: string): ObjectId {
    return new Mongoose.Types.ObjectId(str);
  }

  static newObjectId(): ObjectId {
    return new Mongoose.Types.ObjectId();
  }

  static objectToString(str: string): string {
    return str.toString();
  }

  static generateObjectIds(ids: string[]): Mongoose.Types.ObjectId[] {
    return ids.map((id) => new Mongoose.Types.ObjectId(id));
  }

  static validateLimit(filter: any): number {
    return filter?.limit ? Number(filter.limit) : this.defaultLimit;
  }

  static validateSkip(filter: any): number {
    const effectiveLimit = filter?.limit ? Number(filter.limit) : this.defaultLimit;
    return filter?.skip ? (effectiveLimit * Number(filter.skip)) : this.defaultSkip;
  }

  static validateSort(filter: any): 1 | -1 {
    return filter?.sort ? (!!filter.sort ? 1 : -1) : this.defaultSort;
  }

  static validateSkipLimitSort(filter: any): { skip: number, limit: number, sort: 1 | -1 } {
    const limit = this.validateLimit(filter);
    const skip = this.validateSkip(filter);
    const sort: 1 | -1 = this.validateSort(filter);

    return { limit, skip, sort };
  }

}