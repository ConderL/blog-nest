import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis.Redis;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 在模块初始化时连接Redis
   */
  async onModuleInit() {
    try {
      this.redisClient = new Redis.Redis({
        host: this.configService.get('redis.host', 'localhost'),
        port: this.configService.get('redis.port', 6379),
        password: this.configService.get('redis.password', null),
        db: this.configService.get('redis.db', 0),
      });

      this.redisClient.on('connect', () => {
        this.logger.log('Redis连接成功');
      });

      this.redisClient.on('error', (error) => {
        this.logger.error(`Redis连接错误: ${error.message}`);
      });
    } catch (error) {
      this.logger.error(`初始化Redis客户端失败: ${error.message}`);
    }
  }

  /**
   * 在模块销毁时断开Redis连接
   */
  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.logger.log('Redis连接已关闭');
    }
  }

  /**
   * 获取Redis客户端实例
   */
  getClient(): Redis.Redis {
    return this.redisClient;
  }
}
