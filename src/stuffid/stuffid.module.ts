import { Module } from '@nestjs/common';
import { StuffidService } from './stuffid.service';
import { StuffidRepository } from './stuffid.repository';

@Module({
  providers: [
    StuffidService,
    StuffidRepository,
  ],
  exports: [StuffidService, StuffidRepository],
})
export class StuffidModule {
}

