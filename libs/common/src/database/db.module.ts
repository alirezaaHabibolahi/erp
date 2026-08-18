import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { MongoConnectionService } from './mongodb.service';
import { DBsManagerService } from './DBsManager.service';
import { ConfigService } from '@nestjs/config';



@Module({})
export class DatabaseModule {
    static forRoot(): DynamicModule {
        const mongoConnectionProvider: Provider = {
            provide: MongoConnectionService,
            useClass: MongoConnectionService,
        };

        const dbManagerProvider: Provider = {
            provide: DBsManagerService,
            useFactory: async (
                mongoConnService: MongoConnectionService,
                configService: ConfigService,
            ) => {
                const dbManager = new DBsManagerService(mongoConnService);
                await dbManager.connectDB(
                    configService.get<string>('DATABASE_MONGO_URL') || '',
                    {
                        dbName: configService.get<string>('DATABASE_MONGO_NAME') || '',
                        user: configService.get<string>('DATABASE_MONGO_USER') || '',
                        pass: configService.get<string>('DATABASE_MONGO_PASS') || '',
                    },
                );
                return dbManager;
            },
            inject: [MongoConnectionService, ConfigService],
        };

        const modelProvider: Provider = {
            provide: 'ModelService',
            useFactory: (dbManager: DBsManagerService) => {
                return dbManager.getModels();
            },
            inject: [DBsManagerService],
        };

        return {
            module: DatabaseModule,
            providers: [
                mongoConnectionProvider,
                dbManagerProvider,
                modelProvider,
            ],
            exports: [modelProvider],
        };
    }
}
