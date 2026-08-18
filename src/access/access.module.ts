import { Module } from '@nestjs/common';
import { AccessController } from './access.controller';
import { AccessService } from './access.service';
import { AccessRepository } from './access.repository';

@Module({
  providers: [AccessService, AccessRepository],
  controllers: [AccessController],
  exports: [AccessService],
})
export class AccessModule {}
