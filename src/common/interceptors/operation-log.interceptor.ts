import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { OPERATION_LOG_KEY } from '../decorators/operation-log.decorator';
import { IPUtil } from '../utils/ip.util';
import { LogService } from '../../modules/log/log.service';

/**
 * 操作日志拦截器
 * 用于记录用户操作日志
 */
@Injectable()
export class OperationLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OperationLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const operationType = this.reflector.get<string>(OPERATION_LOG_KEY, context.getHandler());

    // 如果没有标记 OperationLog 装饰器，则跳过
    if (!operationType) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // 由JWT策略注入
    const { url, method } = request;
    const userAgent = request.headers['user-agent'];
    const ip = IPUtil.getClientIp(request);

    return next.handle().pipe(
      tap({
        next: (data) => {
          // 记录操作成功日志
          try {
            this.logService.recordOperation({
              userId: user?.id,
              username: user?.username || '未登录用户',
              ip,
              userAgent,
              path: url,
              method,
              type: operationType,
              params: JSON.stringify(request.body),
              result: JSON.stringify(data).substring(0, 500), // 限制长度
              status: 1, // 成功
            });
          } catch (error) {
            this.logger.error(`记录操作日志失败: ${error.message}`, error.stack);
          }
        },
        error: (error) => {
          // 记录操作失败日志
          try {
            this.logService.recordOperation({
              userId: user?.id,
              username: user?.username || '未登录用户',
              ip,
              userAgent,
              path: url,
              method,
              type: operationType,
              params: JSON.stringify(request.body),
              result: JSON.stringify({
                message: error.message,
                stack: process.env.NODE_ENV === 'production' ? null : error.stack,
              }).substring(0, 500),
              status: 0, // 失败
            });
          } catch (logError) {
            this.logger.error(`记录操作日志失败: ${logError.message}`, logError.stack);
          }
        },
      }),
    );
  }
}
