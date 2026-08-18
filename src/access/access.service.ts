import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException
} from '@nestjs/common';

import { AccessRepository } from './access.repository';
import { CreateAccessDto } from './dto/create-access.dto';
import { IAccess } from '@/types/access';
import { UpdateAccessDto } from './dto/update-access.dto';


@Injectable()
export class AccessService {

  constructor(
    private readonly accessRepository: AccessRepository,
  ) {}

  async create(createAccessDto: CreateAccessDto): Promise<IAccess> {
    const existAccess = await this.accessRepository.findOne({$or:[{fa_name:createAccessDto.fa_name},{en_name: createAccessDto.en_name}]})
    if(existAccess){
      throw new ConflictException("دسترسی با این نام وجود دارد")
    }
    return await this.accessRepository.create(createAccessDto)
  }

  async findAll(): Promise<IAccess[]> {
    return await this.accessRepository.findAll()
  }

  async findById(id: string): Promise<IAccess> {
    const access = await this.accessRepository.findById(id)
    if(!access){
      throw new NotFoundException("دسترسی مورد نظر یافت نشد")
    }
    return access
  }

  async updateOne(id: string, updateAccessDto: UpdateAccessDto) {
    const findAccess = await this.accessRepository.findById(id)
    if(!findAccess){
      throw new NotFoundException("دسترسی مورد نظر یافت نشد")
    }
    const query = {
      $or: [{ fa_name: updateAccessDto.fa_name }, { en_name: updateAccessDto.en_name }],
      _id: { $ne: id },
    }
    const duplicateAccess = await this.accessRepository.findOne(query)
    if(duplicateAccess){
      throw new ConflictException("دسترسی با این نام وجود دارد")
    }
    return await this.accessRepository.updateOne({_id:id}, updateAccessDto, {new: true})
  }

  async deleteOne(id: string){
    const findAccess = await this.accessRepository.findById(id)
    if(!findAccess){
      throw new NotFoundException("دسترسی مورد نظر یافت نشد")
    }

    const existRoleWithAccess = await this.accessRepository.findRoleWithAccesses(id)
    if(existRoleWithAccess){
      throw new BadRequestException("امکان حذف این دسترسی وجود ندارد")
    }

    return await this.accessRepository.deleteById(id)
  }
}