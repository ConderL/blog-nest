import { Injectable, Logger } from '@nestjs/common';
import { ChatGateway } from '../gateways/chat.gateway';
import { IpService } from '../../../services/ip.service';

@Injectable()
export class OnlineUserService {
  private readonly logger = new Logger(OnlineUserService.name);

  constructor(
    private readonly chatGateway: ChatGateway,
    private readonly ipService: IpService,
  ) {}

  /**
   * 获取在线用户列表
   */
  async getOnlineUsers() {
    try {
      const clients = this.chatGateway.getClients();

      // 构建在线用户列表
      const onlineUsers = await Promise.all(
        clients.map(async (client) => {
          const ip = client.data?.ip || client.handshake?.address || '未知IP';
          const nickname = client.data?.nickname || '匿名用户';

          // 获取IP归属地
          let ipSource = '未知位置';
          try {
            ipSource = client.data?.ipSource || (await this.ipService.getIpLocation(ip));
          } catch (error) {
            this.logger.error(`获取IP归属地失败: ${error.message}`);
          }

          // 获取浏览器和操作系统信息
          const userAgent = client.handshake?.headers['user-agent'] || '未知';
          const browser = this.getBrowserInfo(userAgent);
          const os = this.getOsInfo(userAgent);

          // 获取连接时间
          const connectTime = client.data?.connectTime || new Date();

          return {
            id: client.id,
            ip,
            ipSource,
            nickname,
            browser,
            os,
            connectTime,
            loginTime: connectTime,
          };
        }),
      );

      return onlineUsers;
    } catch (error) {
      this.logger.error(`获取在线用户列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取在线用户数量
   */
  getOnlineCount() {
    return this.chatGateway.getOnlineCount();
  }

  /**
   * 强制下线用户
   * @param socketId Socket ID
   */
  forceOffline(socketId: string) {
    try {
      return this.chatGateway.disconnectClient(socketId);
    } catch (error) {
      this.logger.error(`强制下线用户失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取浏览器信息
   */
  private getBrowserInfo(userAgent: string): string {
    if (!userAgent) return '未知';

    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    if (userAgent.includes('MSIE') || userAgent.includes('Trident')) return 'IE';

    return '其他浏览器';
  }

  /**
   * 获取操作系统信息
   */
  private getOsInfo(userAgent: string): string {
    if (!userAgent) return '未知';

    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'MacOS';
    if (userAgent.includes('Linux') && !userAgent.includes('Android')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iPhone') || userAgent.includes('iPad')) return 'iOS';

    return '其他系统';
  }
}
