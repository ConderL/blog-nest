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
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as fs from 'fs';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    cors: true, // 启用CORS支持
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // 开启所有日志级别
  });
  const logger = new Logger('Bootstrap');

  // 配置全局管道
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true, // 将输入数据类型转换为DTO类定义的类型
      whitelist: true, // 过滤掉未在DTO中定义的属性
      forbidNonWhitelisted: false, // 如果存在未在DTO中定义的属性，则抛出错误
      forbidUnknownValues: true, // 未知值会导致验证错误
    }),
  );

  // 配置全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置全局异常过滤器
  app.useGlobalFilters(new AllExceptionsFilter(), new HttpExceptionFilter());

  // 使用Express原生方式提供静态文件
  app.use(
    '/uploads',
    express.static(join(__dirname, '..', 'public', 'uploads'), {
      index: false,
      setHeaders: (res, path) => {
        console.log('提供静态文件:', path);
        // 设置适当的Content-Type和缓存控制
        if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
          res.setHeader('Content-Type', 'image/jpeg');
        } else if (path.endsWith('.png')) {
          res.setHeader('Content-Type', 'image/png');
        } else if (path.endsWith('.gif')) {
          res.setHeader('Content-Type', 'image/gif');
        } else if (path.endsWith('.webp')) {
          res.setHeader('Content-Type', 'image/webp');
        }
        res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
      },
    }),
  );

  // 常规静态文件
  app.use(
    express.static(join(__dirname, '..', 'public'), {
      index: false,
      setHeaders: (res, path) => {
        // 为静态文件设置正确的字符集
        if (path.endsWith('.html')) {
          res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (path.endsWith('.css')) {
          res.setHeader('Content-Type', 'text/css; charset=utf-8');
        } else if (path.endsWith('.js')) {
          res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        // 设置缓存控制
        res.setHeader('Cache-Control', 'public, max-age=86400');
      },
    }),
  );

  // 添加中间件处理预检
  app.use((req, res, next) => {
    // 处理404预检
    if (req.path.startsWith('/uploads/')) {
      console.log('访问上传文件:', req.path);
      const fullPath = join(__dirname, '..', 'public', req.path);
      console.log('映射物理路径:', fullPath);
      console.log('文件是否存在:', fs.existsSync(fullPath) ? '存在' : '不存在');
    }
    next();
  });

  // 配置Swagger
  const options = new DocumentBuilder()
    .setTitle('博客API文档')
    .setDescription('博客系统后端API接口文档')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api-docs', app, document);

  // 启用WebSocket
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    credentials: true,
  });

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
