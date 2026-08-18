import { Module } from '@nestjs/common';
import { ApiGraphqlService } from './api.graphql.service';
import { ApiRestService} from './api.rest.service';

@Module({
  providers: [ApiRestService, ApiGraphqlService],
  exports: [ApiRestService, ApiGraphqlService],
})
export class ApiModule {}
