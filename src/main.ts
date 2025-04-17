import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './common/exceptions/http.exception.filter';
import { DataSource } from 'typeorm';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

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

  // 检查数据库是否已初始化
  const dataSource = app.get(DataSource);
  await checkDatabaseInitialization(dataSource, logger);

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  await app.listen(port);
  logger.log(`应用已启动: http://localhost:${port}`);
}

/**
 * 检查数据库是否已初始化
 * @param dataSource 数据源连接
 * @param logger 日志记录器
 */
async function checkDatabaseInitialization(dataSource: DataSource, logger: Logger) {
  try {
    // 检查数据库中是否有角色表及其数据
    const roleCount = await dataSource.query('SELECT COUNT(*) as count FROM t_role');
    const hasRoles = roleCount[0].count > 0;

    // 检查数据库中是否有菜单表及其数据
    const menuCount = await dataSource.query('SELECT COUNT(*) as count FROM t_menu');
    const hasMenus = menuCount[0].count > 0;

    if (!hasRoles || !hasMenus) {
      logger.warn('==========================================================');
      logger.warn('警告: 数据库初始化不完整，部分功能可能无法正常使用');
      logger.warn('请运行以下命令初始化数据库:');
      logger.warn('npm run db:init');
      logger.warn('==========================================================');
    } else {
      logger.log('数据库初始化检查通过');
    }
  } catch (error) {
    logger.error('数据库初始化检查失败，请确保数据表已正确创建');
    logger.error(`错误详情: ${error.message}`);
  }
}

bootstrap();
