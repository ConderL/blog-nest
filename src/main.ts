import { NestFactory } from '@nestjs/core';
import { VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());

  app.enableVersioning({
    defaultVersion: [VERSION_NEUTRAL, '1'],
    type: VersioningType.URI,
  });

  app.useGlobalInterceptors(new TransformInterceptor());

  // Swagger配置
  const config = new DocumentBuilder()
    .setTitle('Blog API')
    .setDescription('博客系统API文档')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}
bootstrap();
