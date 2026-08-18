
import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { GraphQLRequest } from './graphql-request.service';

@Injectable()
export class ApiGraphqlService {
  private readonly logger = new Logger(ApiGraphqlService.name);

  async callGraphApi(request_url: string, query: string, input: any): Promise<any> {
    try {
      if (!request_url) {
        throw new BadRequestException('Request URL is required');
      }


      const gqlReq: GraphQLRequest = new GraphQLRequest(request_url);
      const response = await gqlReq.request(query, input);


      return response;
    } catch (error) {
      this.logger.error(`GraphQL API call failed: ${error.message}`, error.stack);
      if (error?.msg) {
        throw new BadRequestException(error?.msg);
      }
      // Provide more detailed error message
      const errorMessage = error?.response?.data?.message ||
        error?.message ||
        'Unknown GraphQL error';

      throw new BadRequestException(`GraphQL request failed: ${errorMessage}`);
    }
  }
}