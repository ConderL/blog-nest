import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { OPERATION_LOG_KEY } from '../decorators/operation-log.decorator';
import { getClientIp } from '../utils/ip.util';
import { LogService } from '../../modules/log/log.service';

/**
 * 操作日志拦截器
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
    const { ip, method, path, body, query } = request;
    const userAgent = request.headers['user-agent'];
    const startTime = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const responseTime = Date.now() - startTime;

          try {
            // 记录操作日志
            this.logService.recordOperation({
              userId: user?.id,
              username: user?.username || '匿名用户',
              type: operationType,
              method,
              path,
              ip: getClientIp(request),
              userAgent,
              params: JSON.stringify({ body, query }),
              result: JSON.stringify(data),
              time: responseTime,
            });
          } catch (error) {
            this.logger.error(`记录操作日志失败: ${error.message}`, error.stack);
          }
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;

          try {
            // 记录操作失败日志
            this.logService.recordOperation({
              userId: user?.id,
              username: user?.username || '匿名用户',
              type: operationType,
              method,
              path,
              ip: getClientIp(request),
              userAgent,
              params: JSON.stringify({ body, query }),
              result: JSON.stringify({
                code: error.status || 500,
                message: error.message || '未知错误',
              }),
              time: responseTime,
              status: 0, // 失败状态
            });
          } catch (logError) {
            this.logger.error(`记录操作日志失败: ${logError.message}`, logError.stack);
          }
        },
      }),
    );
  }
}
