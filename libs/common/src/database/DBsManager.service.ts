import { Injectable, Logger } from '@nestjs/common';
import { Connection } from 'mongoose';

import { MongoConnectionService } from './mongodb.service';
import { MongoOption } from 'src/types/general.type';
import { Models } from '@app/common/database/schemas';

@Injectable()
export class DBsManagerService {
    private readonly logger = new Logger(DBsManagerService.name);

    private models?: Models;

    private connection?: Connection;

    constructor(private readonly mongoConnService: MongoConnectionService) {}

    async connectDB(uri: string, options: MongoOption) {
        this.logger.log('Connecting to DB...');
        this.connection = await this.mongoConnService.connectWithRetry(uri, options);
        if (!this.connection) return;
        this.models = new Models(this.connection);
        this.logger.log('DB connected');
    }


    getModels(): Models {
        if (!this.models) {
            throw new Error('models not initialized');
        }
        return this.models;
    }

    async closeConnection(): Promise<void> {
        if (this.connection) {
            await this.connection.close();
            this.logger.log('DB connection closed');
        }
    }
}
