import { GraphQLClient, ClientError } from 'graphql-request';
import { RequestConfig } from 'graphql-request/build/esm/types';

export class GraphQLRequest {
  private headers: {
    key: string;
    value: string;
  }[] = [];
  private defaultHeader: any = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
  private endPoint!: string;
  private graphqlDefaultOptions: RequestConfig = {
    credentials: 'include',
  };

  constructor(endPoint: string) {
    this.endPoint = endPoint;
  }

  public addHeader(key: string, value: string): GraphQLRequest {
    this.headers.push({ key, value });
    return this;
  }

  public setHeader(header: any): GraphQLRequest {
    this.defaultHeader = header;
    return this;
  }

  public setGraphqlOptions(options: RequestConfig): GraphQLRequest {
    this.graphqlDefaultOptions = options;
    return this;
  }

  public async request<VariableType, gqlResponseType>(
    query: string,
    data?: VariableType,
  ): Promise<gqlResponseType> {
    this.headers.forEach((item) => {
      this.defaultHeader[item.key] = item.value;
    });

    this.graphqlDefaultOptions.headers = this.defaultHeader;

    // Add retry logic
    const maxRetries = 5;
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Attempt ${attempt}/${maxRetries} for ${this.endPoint}`);

        const gqRequest = new GraphQLClient(this.endPoint, {
          ...this.graphqlDefaultOptions,
        });

        const result: gqlResponseType = await gqRequest.request<gqlResponseType>(
          query,
          data as any,
        );

        console.log(`GraphQL Response received successfully`);

        // Check for Apollo errors
        const apolloError = this.catchApolloError(result);
        if (apolloError) {
          throw apolloError;
        }

        // Check for custom server errors
        const customError = this.catchCustomServerError(result);
        if (customError) {
          throw customError;
        }

        return result;
      } catch (e: any) {
        lastError = e;

        console.error(`Attempt ${attempt} failed:`, e?.message || e);

        // If it's a connection error, wait before retrying
        if (attempt < maxRetries && this.isConnectionError(e)) {
          const delay = attempt * 2000; // 2, 4, 6 seconds
          console.log(`Waiting ${delay}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    // All retries failed
    console.error(`All ${maxRetries} attempts failed`);

    // Format the error
    if (lastError?.response) {
      const errorResponse = lastError.response;

      if (errorResponse?.errors && Array.isArray(errorResponse.errors) && errorResponse.errors.length > 0) {
        const error = errorResponse.errors[0];
        throw {
          msg: error?.message || 'GraphQL error',
          code: error?.extensions?.code || 'GRAPHQL_ERROR',
          error: true,
          details: error,
        } as any;
      }

      if (errorResponse?.data && typeof errorResponse.data === 'object') {
        const dataObj = errorResponse.data as any;
        throw {
          msg: dataObj?.message || 'GraphQL request failed',
          code: 'GRAPHQL_ERROR',
          error: true,
        } as any;
      }
    }

    if (lastError?.msg) {
      throw lastError;
    }

    // Check for connection-specific errors
    const errorMessage = lastError?.message || 'Unknown error';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('ENOTFOUND')) {
      throw {
        msg: `Cannot connect to ${this.endPoint}. Please check the URL and network connectivity.`,
        code: 'CONNECTION_ERROR',
        error: true,
      } as any;
    }

    throw {
      msg: `GraphQL request failed: ${errorMessage}`,
      code: 'Fetch',
      error: true,
      details: lastError,
    } as any;
  }

  private isConnectionError(error: any): boolean {
    const message = error?.message || '';
    return message.includes('ECONNREFUSED') ||
      message.includes('ENOTFOUND') ||
      message.includes('ETIMEDOUT') ||
      message.includes('ECONNRESET') ||
      message.includes('socket hang up');
  }
  private catchApolloError(result: any) {
    if (result && Array.isArray(result?.errors) && result.errors.length > 0) {
      console.error(`Apollo Error:`, result.errors);
      return {
        response: {
          data: {
            message: result.errors[0]?.message || 'Apollo error',
          },
          status: result.errors[0]?.extensions?.code ?? result.errors[0]?.statusCode ?? 500,
        },
      };
    }
    return null;
  }

  private catchCustomServerError(result: any) {
    if (result?.error) {
      console.error(`Custom Server Error:`, result.error);
      return {
        response: {
          data: {
            message: result.error?.msg || 'Server error',
          },
          status: 400,
        },
      };
    }
    return null;
  }
}