import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './common/exceptions/http.exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 配置全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 将输入数据类型转换为DTO类定义的类型
      whitelist: true, // 过滤掉未在DTO中定义的属性
      forbidNonWhitelisted: true, // 如果存在未在DTO中定义的属性，则抛出错误
      forbidUnknownValues: true, // 未知值会导致验证错误
    }),
  );

  // 配置全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 配置Swagger
  const options = new DocumentBuilder()
    .setTitle('博客API文档')
    .setDescription('博客系统后端API接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  // 允许跨域
  app.enableCors();

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  console.log(`应用已启动: http://localhost:${port}`);
}
bootstrap();
