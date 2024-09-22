import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import './instrument';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
  });

  const config = new DocumentBuilder()
    .setTitle('Unofficial Fußball.de Matches API')
    .setDescription('Get matches by team ids from Fußball.de')
    .setVersion('1.0')
    .setLicense('MIT', 'https://opensource.org/licenses/MIT')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('/', app, document);

  Logger.log('Starting application', 'Bootstrap');
  Logger.log(`Environment: ${process.env.NODE_ENV}`, 'Bootstrap');

  await app.listen(3000);
}
bootstrap();
