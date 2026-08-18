import { Module } from '@nestjs/common';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';
import { AccessModule } from '../access/access.module';
import { UsersModule } from '../users/users.module';
import { RoleRepository } from './role.repository';

@Module({
  imports: [AccessModule],
  providers: [RoleService, RoleRepository],
  controllers: [RoleController],
  exports: [RoleService],
})
export class RoleModule {}
