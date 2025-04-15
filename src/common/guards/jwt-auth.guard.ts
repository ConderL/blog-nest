import { ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  // 公开访问的路径
  private readonly publicPaths: string[] = [
    '/auth/login',
    '/users/register',
    '/articles',
    '/categories',
    '/tags',
    '/comments',
    '/friends',
    '/site-config/frontend',
    '/search',
    '/visit-logs',
  ];

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果标记为公开访问，直接放行
    if (isPublic) {
      return true;
    }

    // 检查是否是公开路径
    const request = context.switchToHttp().getRequest();
    const { url, method } = request;

    if (method === 'GET' && url) {
      // 移除查询参数
      const path = url.split('?')[0];

      for (const publicPath of this.publicPaths) {
        if (path.startsWith(publicPath)) {
          return true;
        }
      }
    }

    // 调用父类的 canActivate 方法进行 JWT 验证
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      throw err || new UnauthorizedException('认证失败');
    }
    return user;
  }
}
