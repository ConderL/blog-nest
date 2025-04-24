import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ValidationError } from '@nestjs/common';
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
      enableDebugMessages: true, // 启用详细调试信息
      stopAtFirstError: false, // 收集所有错误而不是在第一个错误时停止
      transformOptions: {
        enableImplicitConversion: true, // 启用隐式转换
        exposeDefaultValues: true, // 暴露默认值
      },
      // 自定义错误信息格式
      exceptionFactory: (validationErrors: ValidationError[] = []) => {
        const errors = validationErrors.map((error) => {
          const constraints = error.constraints ? Object.values(error.constraints) : [];
          const message = constraints.length > 0 ? constraints[0] : `${error.property}验证失败`;
          return message;
        });
        // 记录详细验证错误信息
        logger.debug(`验证错误: ${JSON.stringify(validationErrors, null, 2)}`);
        logger.debug(`原始请求数据: ${JSON.stringify(validationErrors[0]?.target, null, 2)}`);
        return new Error(errors.join(', '));
      },
    }),
  );

  // 配置全局拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置静态文件服务
  // 主目录
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
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
  });

  // 专门为上传文件配置路由
  app.useStaticAssets(join(__dirname, '..', 'public', 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res, path) => {
      // 为图片类型文件设置适当的Content-Type
      if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
        res.setHeader('Content-Type', 'image/jpeg');
      } else if (path.endsWith('.png')) {
        res.setHeader('Content-Type', 'image/png');
      } else if (path.endsWith('.gif')) {
        res.setHeader('Content-Type', 'image/gif');
      } else if (path.endsWith('.webp')) {
        res.setHeader('Content-Type', 'image/webp');
      }
      // 设置适当的缓存策略
      res.setHeader('Cache-Control', 'public, max-age=2592000'); // 30天
    },
  });

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
  // 设置多个路径访问文档
  SwaggerModule.setup('api-docs', app, document);
  SwaggerModule.setup('swagger-ui', app, document);
  SwaggerModule.setup('v2/api-docs', app, document);
  logger.log('API文档已配置在以下路径:');
  logger.log('- /api-docs');
  logger.log('- /swagger-ui');
  logger.log('- /doc.html (重定向)');
  logger.log('- /v2/api-docs');

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
