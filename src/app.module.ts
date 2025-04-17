import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { RequestInterceptor } from './common/interceptors/request.interceptor';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { BlogModule } from './modules/blog/blog.module';
import { QueueModule } from './modules/queue/queue.module';
import { OauthModule } from './modules/oauth/oauth.module';
import { SearchModule } from './modules/search/search.module';
import { UploadModule } from './modules/upload/upload.module';
import { EmailModule } from './modules/email/email.module';

import configuration from './config/configuration';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
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
  ],
})
export class AppModule {}
