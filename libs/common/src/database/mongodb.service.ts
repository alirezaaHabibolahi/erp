import { Injectable, Logger } from '@nestjs/common';
import mongoose, { Connection } from 'mongoose';
import { MongoOption } from 'src/types/general.type';

@Injectable()
export class MongoConnectionService {
    private readonly logger = new Logger(MongoConnectionService.name);
    private readonly retryDelay = 5000;
    private readonly maxRetries = 5;

    async connectWithRetry(uri: string, options: MongoOption): Promise<Connection> {
        let retries = 0;
        let connection: Connection;
        this.logger.log(`Attempting MongoDB connection to ${uri}, try #${retries + 1}`);

        connection = mongoose.createConnection(uri, options);

        await new Promise<void>((resolve, reject) => {
            connection.once('open', () => {
                this.logger.log(`MongoDB connected to ${uri}`);
                resolve();
            });
            connection.once('error', (err) => {
                reject(err);
            });
        });

        connection.on('disconnected', async () => {
            this.logger.warn(`MongoDB disconnected from ${uri}! Attempting to reconnect...`);

            while (retries < this.maxRetries) {
                try {
                    retries++;
                    this.logger.log(`Reconnect attempt #${retries} after ${this.retryDelay}ms`);
                    await new Promise((res) => setTimeout(res, this.retryDelay));

                    await connection.openUri(uri, options);

                    this.logger.log(`MongoDB reconnected on attempt #${retries}`);
                    retries = 0;
                    break;
                } catch (err) {
                    this.logger.warn(`Reconnect attempt #${retries} failed:`);
                }
            }

            if (retries >= this.maxRetries) {
                this.logger.warn(
                    `MongoDB reconnection failed after ${this.maxRetries} attempts. Giving up.`,
                );
            }
        });

        return connection;
    }
}
