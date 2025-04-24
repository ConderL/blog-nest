import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Logger } from '@nestjs/common';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) {
      return true; // 如果没有设置角色要求，则允许访问
    }

    const { user } = context.switchToHttp().getRequest();
    this.logger.debug(
      `RolesGuard检查用户权限: ${JSON.stringify(user)}, 需要角色: ${requiredRoles}`,
    );

    // 确保用户对象存在
    if (!user) {
      this.logger.warn('用户对象不存在，拒绝访问');
      return false;
    }

    // 使用用户名判断是否为管理员
    // 如果requiredRoles包含'admin'，则只有username为'admin'的用户才能访问
    if (requiredRoles.includes('admin')) {
      const isAdmin = user.username === 'admin';
      this.logger.debug(`请求需要管理员权限，用户名: ${user.username}, 是否是管理员: ${isAdmin}`);
      return isAdmin;
    }

    // 对于其他角色类型，可以根据实际情况扩展
    return false;
  }
}
