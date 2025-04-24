import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestInterceptor } from './common/interceptors/request.interceptor';
import { TokenBlacklistGuard } from './common/guards/token-blacklist.guard';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BlogModule } from './modules/blog/blog.module';
import { QueueModule } from './modules/queue/queue.module';
import { OauthModule } from './modules/oauth/oauth.module';
import { SearchModule } from './modules/search/search.module';
import { UploadModule } from './modules/upload/upload.module';
import { EmailModule } from './modules/email/email.module';
import { CacheModule } from '@nestjs/cache-manager';
import { CaptchaModule } from './modules/captcha/captcha.module';
import { HttpModule, HttpService } from '@nestjs/axios';
import { IpService } from './services/ip.service';
import { ChatModule } from './modules/chat/chat.module';
import { ToolsModule } from './modules/tools/tools.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { VisitLogInterceptor } from './common/interceptors/visit-log.interceptor';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import {
  AllExceptionsFilter,
  HttpExceptionFilter,
} from './common/exceptions/http.exception.filter';
import { LogModule } from './modules/log/log.module';

import configuration from './config/configuration';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    // 缓存模块
    CacheModule.register({
      isGlobal: true, // 全局可用
      ttl: 60 * 60 * 1000, // 默认缓存1小时
    }),
    // 数据库模块
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 3306),
        username: configService.get('DB_USERNAME', 'root'),
        password: configService.get('DB_PASSWORD', 'root'),
        database: configService.get('DB_DATABASE', 'blog'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNCHRONIZE', false),
        logging: configService.get<boolean>('DB_LOGGING', false),
        timezone: '+08:00',
        charset: 'utf8mb4',
      }),
    }),
    // 业务模块
    EmailModule,
    UploadModule,
    OauthModule,
    SearchModule,
    QueueModule,
    AuthModule,
    UserModule,
    BlogModule,
    CaptchaModule,
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    ChatModule,
    ToolsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      exclude: ['/api*'],
    }),
    LogModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestInterceptor,
    },
    {
      provide: APP_GUARD,
      useClass: TokenBlacklistGuard,
    },
    {
      provide: IpService,
      useFactory: (httpService: HttpService, configService: ConfigService) => {
        return new IpService(httpService, configService);
      },
      inject: [HttpService, ConfigService],
    },
    // 全局日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: VisitLogInterceptor,
    },
    // 全局操作日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
    // 全局异常过滤器
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    // HTTP异常过滤器
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
  ],
  exports: [IpService],
})
export class AppModule {}
