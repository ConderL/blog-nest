import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { VisitLog } from './entities/visit-log.entity';
import { OperationLog } from './entities/operation-log.entity';
import * as moment from 'moment';
import axios from 'axios';

@Injectable()
export class LogService {
  private readonly logger = new Logger(LogService.name);

  constructor(
    @InjectRepository(VisitLog)
    private readonly visitLogRepository: Repository<VisitLog>,
    @InjectRepository(OperationLog)
    private readonly operationLogRepository: Repository<OperationLog>,
  ) {}

  /**
   * 记录访问日志
   */
  async recordVisit(data: {
    ip: string;
    userAgent: string;
    url: string;
    page: string;
  }): Promise<VisitLog> {
    try {
      let browser = '未知';
      let os = '未知';

      if (data.userAgent.includes('Chrome')) {
        browser = 'Chrome';
      } else if (data.userAgent.includes('Firefox')) {
        browser = 'Firefox';
      } else if (data.userAgent.includes('Safari')) {
        browser = 'Safari';
      } else if (data.userAgent.includes('Edge')) {
        browser = 'Edge';
      } else if (data.userAgent.includes('MSIE') || data.userAgent.includes('Trident')) {
        browser = 'Internet Explorer';
      }

      if (data.userAgent.includes('Windows')) {
        os = 'Windows';
      } else if (data.userAgent.includes('Mac')) {
        os = 'MacOS';
      } else if (data.userAgent.includes('Linux')) {
        os = 'Linux';
      } else if (data.userAgent.includes('Android')) {
        os = 'Android';
      } else if (data.userAgent.includes('iPhone')) {
        os = 'iOS';
      } else if (data.userAgent.includes('iPad')) {
        os = 'iOS';
      }

      // 尝试获取IP地理位置
      let ipSourceInfo = '';
      try {
        ipSourceInfo = (await this.getIpSource(data.ip)) || '';
      } catch (error) {
        this.logger.error(`获取IP地理位置失败: ${error.message}`);
      }

      // 创建VisitLog对象，字段名与实体定义一致
      const visitLog = new VisitLog();
      visitLog.ipAddress = data.ip;
      visitLog.page = data.page;
      visitLog.browser = browser;
      visitLog.os = os;
      visitLog.ipSource = ipSourceInfo;
      visitLog.createTime = new Date(); // 手动设置当前时间

      return this.visitLogRepository.save(visitLog);
    } catch (error) {
      this.logger.error(`记录访问日志失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 记录操作日志
   */
  async recordOperation(data: {
    userId?: number;
    username?: string;
    type: string;
    module?: string;
    description?: string;
    method?: string;
    path?: string;
    params?: string;
    ip?: string;
    userAgent?: string;
    result?: string;
    time?: number;
    status?: number;
  }): Promise<OperationLog> {
    try {
      let ipSource = '';
      if (data.ip) {
        try {
          ipSource = (await this.getIpSource(data.ip)) || '';
        } catch (error) {
          this.logger.error(`获取IP地理位置失败: ${error.message}`);
        }
      }

      const operationLog = this.operationLogRepository.create({
        userId: data.userId,
        username: data.username,
        type: data.type,
        module: data.module,
        description: data.description,
        method: data.method,
        path: data.path,
        params: data.params,
        ip: data.ip,
        ipSource,
        status: data.status ?? 1,
        time: data.time,
        result: data.result,
        userAgent: data.userAgent,
      });

      return this.operationLogRepository.save(operationLog);
    } catch (error) {
      this.logger.error(`记录操作日志失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取IP地理位置
   * @param ip IP地址
   */
  private async getIpSource(ip: string): Promise<string | null> {
    if (
      ip.startsWith('127.') ||
      ip.startsWith('192.168.') ||
      ip.startsWith('10.') ||
      ip === '::1'
    ) {
      return '内网IP';
    }

    try {
      const response = await axios.get(`http://ip-api.com/json/${ip}?lang=zh-CN`);
      if (response.data && response.data.status === 'success') {
        const { country, regionName, city, isp } = response.data;
        return `${country} ${regionName} ${city} ${isp}`;
      }
      return null;
    } catch (error) {
      this.logger.error(`查询IP地理位置失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 清理指定日期之前的访问日志
   */
  async cleanupOldLogs(days: number = 30): Promise<number> {
    try {
      const cutoffDate = moment().subtract(days, 'days').toDate();
      const result = await this.visitLogRepository.delete({
        createTime: LessThan(cutoffDate) as any,
      });

      return result.affected || 0;
    } catch (error) {
      this.logger.error(`清理旧日志失败: ${error.message}`);
      return 0;
    }
  }

  /**
   * 获取最近的访问日志
   */
  async getRecentVisits(limit: number = 10): Promise<VisitLog[]> {
    return this.visitLogRepository.find({
      order: { createTime: 'DESC' } as any,
      take: limit,
    });
  }

  /**
   * 获取最近的操作日志
   */
  async getRecentOperations(limit: number = 10): Promise<OperationLog[]> {
    return this.operationLogRepository.find({
      order: { createdAt: 'DESC' } as any,
      take: limit,
    });
  }

  /**
   * 统计一段时间内的访问量
   */
  async countVisits(startDate: Date, endDate: Date): Promise<number> {
    return this.visitLogRepository.count({
      where: {
        createTime: Between(startDate, endDate) as any,
      },
    });
  }

  /**
   * 统计一段时间内的独立访客数
   */
  async countUniqueVisitors(startDate: Date, endDate: Date): Promise<number> {
    const result = await this.visitLogRepository
      .createQueryBuilder('log')
      .select('COUNT(DISTINCT log.ipAddress)', 'count')
      .where('log.createTime BETWEEN :startDate AND :endDate', { startDate, endDate })
      .getRawOne();

    return parseInt(result.count, 10);
  }

  /**
   * 获取按小时统计的访问量
   */
  async getHourlyVisits(date: Date = new Date()): Promise<any[]> {
    const startOfDay = moment(date).startOf('day').toDate();
    const endOfDay = moment(date).endOf('day').toDate();

    const result = await this.visitLogRepository
      .createQueryBuilder('log')
      .select('HOUR(log.createTime)', 'hour')
      .addSelect('COUNT(log.id)', 'count')
      .where('log.createTime BETWEEN :startOfDay AND :endOfDay', { startOfDay, endOfDay })
      .groupBy('hour')
      .orderBy('hour', 'ASC')
      .getRawMany();

    const hourlyData = Array(24)
      .fill(0)
      .map((_, hour) => ({ hour, count: 0 }));

    result.forEach((item) => {
      hourlyData[parseInt(item.hour, 10)].count = parseInt(item.count, 10);
    });

    return hourlyData;
  }
}
