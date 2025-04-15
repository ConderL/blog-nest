import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from './config/config.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { UserModule } from './modules/user/user.module';
import { AuthModule } from './modules/auth/auth.module';
import { BlogModule } from './modules/blog/blog.module';
import { TaskModule } from './modules/task/task.module';
import { LogModule } from './modules/log/log.module';
import { CommonModule } from './common/common.module';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { OperationLogInterceptor } from './common/interceptors/operation-log.interceptor';
import { VisitLogInterceptor } from './common/interceptors/visit-log.interceptor';
import { LogInterceptor } from './common/interceptors/log.interceptor';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('database.host'),
        port: configService.get('database.port'),
        username: configService.get('database.username'),
        password: configService.get('database.password'),
        database: configService.get('database.database'),
        autoLoadEntities: true,
        synchronize: configService.get('app.env') === 'development',
      }),
      inject: [ConfigService],
    }),
    UserModule,
    AuthModule,
    BlogModule,
    TaskModule,
    LogModule,
    CommonModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LogInterceptor,
    },
    // 全局异常拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    // 操作日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: OperationLogInterceptor,
    },
    // 访问日志拦截器
    {
      provide: APP_INTERCEPTOR,
      useClass: VisitLogInterceptor,
    },
  ],
})
export class AppModule {}
