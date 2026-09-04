import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import {
  asUnknownRecord,
  getErrorMessage,
  getErrorStack,
} from '@app/common/utils';
import { GraphQLRequest } from './graphql-request.service';

@Injectable()
export class ApiGraphqlService {
  private readonly logger = new Logger(ApiGraphqlService.name);

  async callGraphApi(
    request_url: string,
    query: string,
    input: any,
  ): Promise<any> {
    try {
      if (!request_url) {
        throw new BadRequestException('Request URL is required');
      }

      const gqlReq: GraphQLRequest = new GraphQLRequest(request_url);
      const response = await gqlReq.request(query, input);

      return response;
    } catch (error) {
      const errorRecord = asUnknownRecord(error);
      const message = getErrorMessage(error, 'Unknown GraphQL error');

      this.logger.error(
        `GraphQL API call failed: ${message}`,
        getErrorStack(error),
      );

      if (typeof errorRecord.msg === 'string') {
        throw new BadRequestException(errorRecord.msg);
      }

      // Provide more detailed error message
      const response = asUnknownRecord(errorRecord.response);
      const data = asUnknownRecord(response.data);
      const errorMessage =
        typeof data.message === 'string' ? data.message : message;

      throw new BadRequestException(`GraphQL request failed: ${errorMessage}`);
    }
  }
}
