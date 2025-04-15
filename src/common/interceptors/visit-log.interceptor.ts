import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { VISIT_LOG_KEY } from '../decorators/visit-log.decorator';
import { getClientIp } from '../utils/ip.util';
import { LogService } from '../../modules/log/log.service';

/**
 * 访问日志拦截器
 */
@Injectable()
export class VisitLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(VisitLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly logService: LogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const pageName = this.reflector.get<string>(VISIT_LOG_KEY, context.getHandler());

    // 如果没有标记 VisitLog 装饰器，则跳过
    if (!pageName) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // 由JWT策略注入
    const { url } = request;
    const userAgent = request.headers['user-agent'];
    const referer = request.headers['referer'];
    const ip = getClientIp(request);

    try {
      // 记录访问日志
      this.logService.recordVisit({
        ip,
        userAgent,
        url,
        page: pageName,
        referer,
        userId: user?.id,
      });
    } catch (error) {
      this.logger.error(`记录访问日志失败: ${error.message}`, error.stack);
    }

    return next.handle().pipe(
      tap({
        next: () => {
          // 访问成功，可以添加额外处理
        },
        error: (error) => {
          // 访问失败，可以添加额外处理
          this.logger.warn(`页面 ${pageName} 访问失败: ${error.message}`);
        },
      }),
    );
  }
}
