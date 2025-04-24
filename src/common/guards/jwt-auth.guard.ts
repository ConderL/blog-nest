import { ExecutionContext, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  // 公开访问的路径
  private readonly publicPaths: string[] = [
    '/auth/login',
    '/admin/auth/login',
    '/users/register',
    '/articles',
    '/categories',
    '/tags',
    '/comments/list',
    '/friend',
    '/message',
    '/album',
    '/site-config/frontend',
    '/search',
    '/visit-logs',
    '/report',
    '/',
    '/about',
    // Swagger API文档相关路径
    '/doc.html',
    '/api-docs',
    '/swagger-ui',
    '/swagger-resources',
    '/v2/api-docs',
    '/v3/api-docs',
    '/favicon.ico',
  ];

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    this.logger.debug(`请求路径: ${request.method} ${request.url}, 是否公开接口: ${isPublic}`);

    if (isPublic) {
      this.logger.log('Endpoint is marked as public, skipping authentication');
      return true;
    }

    // 检查是否有Authorization头
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      this.logger.warn('请求缺少Authorization头');
    } else {
      const [type, token] = authHeader.split(' ');
      this.logger.debug(
        `Authorization头类型: ${type}, 令牌: ${token ? token.substring(0, 15) + '...' : 'missing'}, 完整值: ${authHeader}`,
      );

      if (type !== 'Bearer') {
        this.logger.warn(`无效的认证头前缀: ${type}, 应为Bearer`);
      }

      if (!token) {
        this.logger.warn('无效的认证头: 缺少token部分');
      } else if (token === '[object Object]' || token.includes('[object Object]')) {
        this.logger.warn(`无效的token格式: ${token}`);
      }
    }

    // 检查是否是公开路径
    const { url, method } = request;
    this.logger.log(`Checking access to ${method} ${url}`);

    if (url) {
      // 移除查询参数
      const path = url.split('?')[0];

      for (const publicPath of this.publicPaths) {
        if (path === publicPath || path.startsWith(publicPath + '/')) {
          this.logger.log(
            `Path ${path} matches public path ${publicPath}, skipping authentication`,
          );
          return true;
        }
      }
    }

    // 调用父类的 canActivate 方法进行 JWT 验证
    this.logger.log(`Path ${url} requires authentication, validating JWT token`);
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      this.logger.error(`认证失败: ${err?.message || info?.message || '未知错误'}`);
      throw err || new UnauthorizedException('认证失败，请重新登录');
    }

    this.logger.debug(`认证成功，用户: ${user.username}`);
    return user;
  }
}
