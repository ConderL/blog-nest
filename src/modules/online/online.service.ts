import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { OnlineUserDto } from './dto/online-user.dto';

/**
 * 在线用户服务
 */
@Injectable()
export class OnlineService {
  private readonly logger = new Logger(OnlineService.name);
  private readonly ONLINE_USER_KEY = 'blog:online:users';
  private readonly USER_TOKEN_KEY_PREFIX = 'blog:user:token:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * 添加在线用户
   * @param onlineUser 在线用户信息
   */
  async addOnlineUser(onlineUser: OnlineUserDto): Promise<void> {
    try {
      // 保存用户会话信息
      await this.redisService.getClient().hset(
        this.ONLINE_USER_KEY,
        onlineUser.tokenId,
        JSON.stringify(onlineUser)
      );

      // 记录用户ID和tokenId的关系，用于查询用户所有会话
      await this.redisService.getClient().sadd(
        `${this.USER_TOKEN_KEY_PREFIX}${onlineUser.userId}`,
        onlineUser.tokenId
      );

      this.logger.log(`添加在线用户成功: ${onlineUser.nickname}(${onlineUser.userId})`);
    } catch (error) {
      this.logger.error(`添加在线用户失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 移除在线用户
   * @param tokenId 会话ID
   */
  async removeOnlineUser(tokenId: string): Promise<void> {
    try {
      // 获取用户信息
      const userJson = await this.redisService.getClient().hget(this.ONLINE_USER_KEY, tokenId);
      if (userJson) {
        const user: OnlineUserDto = JSON.parse(userJson);
        
        // 移除用户会话信息
        await this.redisService.getClient().hdel(this.ONLINE_USER_KEY, tokenId);
        
        // 移除用户ID与tokenId的关联
        if (user.userId) {
          await this.redisService.getClient().srem(
            `${this.USER_TOKEN_KEY_PREFIX}${user.userId}`,
            tokenId
          );
        }
        
        this.logger.log(`移除在线用户成功: ${user.username || tokenId}`);
      }
    } catch (error) {
      this.logger.error(`移除在线用户失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 强制用户下线
   * @param tokenId 会话ID
   */
  async forceOffline(tokenId: string): Promise<void> {
    await this.removeOnlineUser(tokenId);
  }

  /**
   * 更新用户最后访问时间
   * @param tokenId 会话ID
   */
  async updateLastAccessTime(tokenId: string): Promise<void> {
    try {
      const userJson = await this.redisService.getClient().hget(this.ONLINE_USER_KEY, tokenId);
      if (userJson) {
        const user: OnlineUserDto = JSON.parse(userJson);
        user.lastAccessTime = new Date();
        
        await this.redisService.getClient().hset(
          this.ONLINE_USER_KEY,
          tokenId,
          JSON.stringify(user)
        );
      }
    } catch (error) {
      this.logger.error(`更新用户最后访问时间失败: ${error.message}`);
    }
  }

  /**
   * 获取所有在线用户
   */
  async getOnlineUsers(): Promise<OnlineUserDto[]> {
    try {
      const users = await this.redisService.getClient().hvals(this.ONLINE_USER_KEY);
      return users.map(user => JSON.parse(user));
    } catch (error) {
      this.logger.error(`获取在线用户列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 获取在线用户数量
   */
  async getOnlineUserCount(): Promise<number> {
    try {
      return await this.redisService.getClient().hlen(this.ONLINE_USER_KEY);
    } catch (error) {
      this.logger.error(`获取在线用户数量失败: ${error.message}`);
      return 0;
    }
  }

  /**
   * 获取用户所有会话
   * @param userId 用户ID
   */
  async getUserSessions(userId: number): Promise<OnlineUserDto[]> {
    try {
      const tokenIds = await this.redisService.getClient().smembers(
        `${this.USER_TOKEN_KEY_PREFIX}${userId}`
      );
      
      if (!tokenIds || tokenIds.length === 0) {
        return [];
      }
      
      const sessions: OnlineUserDto[] = [];
      for (const tokenId of tokenIds) {
        const userJson = await this.redisService.getClient().hget(this.ONLINE_USER_KEY, tokenId);
        if (userJson) {
          sessions.push(JSON.parse(userJson));
        }
      }
      
      return sessions;
    } catch (error) {
      this.logger.error(`获取用户会话列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 清除过期会话（超过指定时间未活动）
   * @param expireTime 过期时间（毫秒）
   */
  async clearExpiredSessions(expireTime: number = 30 * 60 * 1000): Promise<number> {
    try {
      const users = await this.getOnlineUsers();
      const now = new Date().getTime();
      let removedCount = 0;
      
      for (const user of users) {
        const lastAccessTime = new Date(user.lastAccessTime).getTime();
        if (now - lastAccessTime > expireTime) {
          await this.removeOnlineUser(user.tokenId);
          removedCount++;
        }
      }
      
      this.logger.log(`清除过期会话完成，共清除${removedCount}个会话`);
      return removedCount;
    } catch (error) {
      this.logger.error(`清除过期会话失败: ${error.message}`);
      return 0;
    }
  }
} 