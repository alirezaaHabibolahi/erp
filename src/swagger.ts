import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication) {
    const config = new DocumentBuilder()
        .setTitle('poolam API')
        .setDescription('API documentation for the poolam service')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                in: 'header',
                name: 'Authorization',
                description: 'Enter JWT token',
            },
            'bearer'
        )
        .build();

    const document = SwaggerModule.createDocument(app, config, {
        // You can include or exclude modules/controllers here if needed
        deepScanRoutes: true,
    });

    SwaggerModule.setup('docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
            displayRequestDuration: true,
        },
        customSiteTitle: 'poolam API Docs',
    });
}


