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
        host: configService.get('database.host', 'localhost'),
        port: configService.get('database.port', 3306),
        username: configService.get('database.username', 'root'),
        password: configService.get('database.password', 'root'),
        database: configService.get('database.database', 'blog'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: false,
        extra: {
          charset: 'utf8mb4',
        },
        charset: 'utf8mb4',
        collation: 'utf8mb4_unicode_ci',
        // logging: process.env.NODE_ENV !== 'production',
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
  ],
  providers: [
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
  ],
  controllers: [],
  exports: [IpService],
})
export class AppModule {}
