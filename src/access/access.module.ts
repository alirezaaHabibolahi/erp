import { Module } from '@nestjs/common';
import { PrismaModule } from '@app/common';
import { AccessService } from './access.service';
import { AuthorizationTestController } from './authorization-test.controller';

@Module({
  imports: [PrismaModule],
  controllers: [AuthorizationTestController],
  providers: [AccessService],
  exports: [AccessService],
})
export class AccessModule {}
