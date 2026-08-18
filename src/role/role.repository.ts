import { Injectable, Inject } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { IRole, Models } from '@app/common';
import { ObjectId } from 'mongodb';
import { IRoleDoc } from '@/types/role';

@Injectable()
export class RoleRepository {
  constructor(@Inject('ModelService') private readonly models: Models) {
  }

  private get roleModel() {
    return this.models.role.model;
  }

  private get userModel() {
    return this.models.user.model;
  }

  async create(data: IRole): Promise<IRole> {
    return await this.roleModel.create(data);
  }

  async findAll(): Promise<IRole[]> {
    return await this.roleModel.find().lean();
  }

  async findRoles(filterQuery: FilterQuery<IRole>): Promise<IRole[]> {
    return await this.roleModel.find(filterQuery).lean();
  }

  async findOne(filter: FilterQuery<IRole>): Promise<IRole | null> {
    return this.roleModel.findOne(filter).lean();
  }

  async findById(id: string): Promise<IRole | null> {
    return await this.roleModel.findById(id);
  }

  async findRoleWithAccesses(id: string): Promise<IRole | null> {
    const pipeline = [
      {
        $match:{
          _id: new ObjectId(id),
        }
      },
      {
        $lookup: {
          from: "accesses",
          let: { accessIds: "$accesses" },
          pipeline: [
            {
              $match: {
                $expr: { $in: ["$_id", "$$accessIds"] }
              }
            },
            {
              $project: {
                _id: 1,
                en_name: 1,
                fa_name: 1
              }
            }
          ],
          as: "accesses"
        }
      }
    ]
    const roles = await this.roleModel.aggregate(pipeline);
    return roles?.length ? roles[0] : null;
  }
  async updateOne(
    filter: FilterQuery<IRole>,
    updateQuery: UpdateQuery<IRole>,
    options?: any,
  ) {
    return await this.roleModel.updateOne(filter, updateQuery, options);
  }

  async updateMany(
    filter: FilterQuery<IRole>,
    updateQuery: UpdateQuery<IRole>,
    options?: any,
  ) {
    return await this.roleModel.updateMany(filter, updateQuery, options);
  }

  async deleteById(id: string) {
    return await this.roleModel.findByIdAndDelete(id);
  }

  async findUserWithRole(roleId: string) {
    return await this.userModel.exists({role: new ObjectId(roleId)})
  }
}