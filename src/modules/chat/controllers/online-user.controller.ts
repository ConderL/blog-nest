import { Controller, Get, Post, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OnlineUserService } from '../services/online-user.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { Result } from '../../../common/utils/result';

@ApiTags('在线用户管理')
@Controller('admin/online')
@Roles('admin')
@ApiBearerAuth()
export class OnlineUserController {
  private readonly logger = new Logger(OnlineUserController.name);

  constructor(private readonly onlineUserService: OnlineUserService) {}

  @ApiOperation({ summary: '获取在线用户列表', description: '获取当前所有在线的用户列表' })
  @Get('list')
  async getOnlineUsers() {
    try {
      const onlineUsers = await this.onlineUserService.getOnlineUsers();
      const count = this.onlineUserService.getOnlineCount();

      return Result.ok({
        recordList: onlineUsers,
        count: count,
      });
    } catch (error) {
      this.logger.error(`获取在线用户列表失败: ${error.message}`);
      return Result.fail('获取在线用户列表失败');
    }
  }

  @ApiOperation({ summary: '强制用户下线', description: '强制指定的用户断开连接' })
  @Post('forceOffline')
  async forceOffline(@Body() body: { socketId: string }) {
    try {
      const success = await this.onlineUserService.forceOffline(body.socketId);
      if (success) {
        return Result.ok(null, '强制下线成功');
      } else {
        return Result.fail('强制下线失败，用户可能已经离线');
      }
    } catch (error) {
      this.logger.error(`强制用户下线失败: ${error.message}`);
      return Result.fail('强制用户下线失败');
    }
  }
}
