import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { RoleRepository } from './role.repository';
import { GeneralHelper, IRole } from '@app/common';
import { AccessService } from '../access/access.service';
import { UsersService } from '../users/users.service';
import { ObjectId } from 'mongodb';

@Injectable()
export class RoleService {

  constructor(
    private readonly roleRepository: RoleRepository,
    private readonly accessService: AccessService,
  ) {
  }

  async create(dto: CreateRoleDto) {
    const roleExists = await this.roleRepository.findOne({
      en_name: dto.en_name,
    });

    if (roleExists) {
      throw new BadRequestException('نقش دیگری با این نام وجود دارد');
    }

    await this.validateAccesses(dto.accesses);

    return this.roleRepository.create({
      ...dto,
      accesses: GeneralHelper.generateObjectIds(dto.accesses),
      _id: new ObjectId()
    });
  }

  async findAll() {
    return this.roleRepository.findAll();
  }

  async findRole(id: string) {
    const role = await this.roleRepository.findRoleWithAccesses(id);
    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }
    return role;
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role  = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    if (dto.en_name && dto.en_name !== role.en_name) {
      const exists = await this.roleRepository.findOne({
        en_name: dto.en_name,
      });

      if (exists) {
        throw new BadRequestException('نقش دیگری با این نام وجود دارد');
      }
    }

    if (dto.accesses) {
      await this.validateAccesses(dto.accesses);
      role.accesses = GeneralHelper.generateObjectIds(dto.accesses);
    }

    if (dto.fa_name) role.fa_name = dto.fa_name;
    if (dto.en_name) role.en_name = dto.en_name;

    return this.roleRepository.updateOne({_id:id}, role);
  }

  async delete(id: string) {
    const role = await this.roleRepository.findById(id);

    if (!role) {
      throw new NotFoundException('نقش مورد نظر یافت نشد');
    }

    const findUserByRole = await this.roleRepository.findUserWithRole(id)
    if(findUserByRole){
      throw new BadRequestException("کاربری با این نقش وجود دارد")
    }
    return await this.roleRepository.deleteById(id);
  }

  private async validateAccesses(accessIds: string[]) {
    const accesses = await this.accessService.findAll();

    const accessSet = new Set(accesses.map((a) => a._id.toString()));

    for (const id of accessIds) {
      if (!accessSet.has(id)) {
        throw new BadRequestException(`دسترسی ${id} وجود ندارد`);
      }
    }
  }
}
