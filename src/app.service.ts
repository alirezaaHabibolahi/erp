import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  startService(): string {
    return 'Service is running...';
  }
}
