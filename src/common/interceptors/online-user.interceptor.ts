import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { OnlineService } from '../../modules/online/online.service';

/**
 * 在线用户拦截器
 * 用于更新在线用户的最后访问时间
 */
@Injectable()
export class OnlineUserInterceptor implements NestInterceptor {
  private readonly logger = new Logger(OnlineUserInterceptor.name);

  constructor(private readonly onlineService: OnlineService) {}

  /**
   * 拦截请求
   * @param context 执行上下文
   * @param next 调用处理器
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();

    // 获取请求中的token
    const authHeader = request.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      // 异步更新用户最后访问时间
      this.onlineService.updateLastAccessTime(token).catch((error) => {
        this.logger.error(`更新用户最后访问时间失败: ${error.message}`);
      });
    }

    return next.handle();
  }
}
