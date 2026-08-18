import { Injectable, Inject } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { IUser, Models } from '@app/common';
import { ObjectId } from 'mongodb';

@Injectable()
export class UserRepository {

  constructor(
    @Inject('ModelService') private models: Models,
  ) {
  }

  private get userModel() {
    return this.models.user.model;
  }

  async create(userData: Partial<IUser>): Promise<IUser> {
    return this.userModel.create(userData);
  }

  async findAll(): Promise<IUser[]> {
    return this.userModel.find().exec();
  }

  async findOne(filter: FilterQuery<IUser>): Promise<IUser | null> {
    return this.userModel.findOne(filter).lean();
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findByPhone(phone: string): Promise<IUser | null> {
    return this.userModel.findOne({ phone }).exec();
  }


  async findById(_id: string): Promise<IUser | null> {
    return this.userModel.findById(_id).exec();
  }

  async updateOne(
    filter: FilterQuery<IUser>,
    updateQuery: UpdateQuery<IUser>,
    options?: any,
  ) {
    return await this.userModel.updateOne(filter, updateQuery, options);
  }

  async updateMany(
    filter: FilterQuery<IUser>,
    updateQuery: UpdateQuery<IUser>,
    options?: any,
  ) {
    return await this.userModel.updateMany(filter, updateQuery, options);
  }

  async updateById(id: string, updateData: Partial<IUser>): Promise<IUser | null> {
    return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
  }

  async deleteById(id: string): Promise<IUser | null> {
    return this.userModel.findByIdAndDelete(id).exec();
  }

  async findUsers(filterQuery: FilterQuery<IUser>): Promise<IUser[]> {
    return this.userModel.find(filterQuery).exec();
  }

  async getUserWithRolesAndAccesses(id: string) {
    return  this.userModel.aggregate([
      {
        $match: {
          _id: new ObjectId(id),
        },
      },
      {
        $lookup: {
          from: 'roles',
          localField: 'role',
          foreignField: '_id',
          as: 'role',
        },
      },
      { $unwind: '$role' },
      {
        $lookup: {
          from: 'accesses',
          localField: 'role.accesses',
          foreignField: '_id',
          as: 'accesses',
        },
      },
      {
        $addFields: {
          accesses: { $setUnion: ["$accesses.en_name", []] }
        },
      },
    ]);
  }
}
