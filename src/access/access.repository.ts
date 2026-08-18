import { Injectable, Inject } from '@nestjs/common';
import { FilterQuery, UpdateQuery } from 'mongoose';
import { IAccess, Models } from '@app/common';
import { ObjectId } from 'mongodb';
import { CreateAccessDto } from './dto/create-access.dto';

@Injectable()
export class AccessRepository {
  constructor(@Inject('ModelService') private readonly models: Models) {
  }

  private get accessModel() {
    return this.models.access.model;
  }

  private get roleModel(){
    return this.models.role.model;
  }

  async create(accessInfo: CreateAccessDto): Promise<IAccess> {
    return await this.accessModel.create(accessInfo);
  }

  async findAll(): Promise<IAccess[]> {
    return await this.accessModel.find().lean();
  }

  async findAccesses(filterQuery: FilterQuery<IAccess>): Promise<IAccess[]> {
    return await this.accessModel.find(filterQuery).lean();
  }

  async findOne(filter: FilterQuery<IAccess>): Promise<IAccess | null> {
    return this.accessModel.findOne(filter).lean();
  }

  async findById(id: string): Promise<IAccess | null> {
    return await this.accessModel.findById(id).lean();
  }

  async updateOne(
    filter: FilterQuery<IAccess>,
    updateQuery: UpdateQuery<IAccess>,
    options?: any,
  ) {
    return await this.accessModel.updateOne(filter, updateQuery, options);
  }

  async updateMany(
    filter: FilterQuery<IAccess>,
    updateQuery: UpdateQuery<IAccess>,
    options?: any,
  ) {
    return await this.accessModel.updateMany(filter, updateQuery, options);
  }

  async deleteById(id: string) {
    return await this.accessModel.findByIdAndDelete(id);
  }

  async findRoleWithAccesses(accessId: string) {
    return this.roleModel.exists({
      accesses: new ObjectId(accessId)
    });  }

}