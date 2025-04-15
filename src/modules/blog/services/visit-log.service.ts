import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { VisitLog } from '../entities/visit-log.entity';
import { getTodayRange, getRecentDays, formatDate } from '../../../common/utils/date.utils';

@Injectable()
export class VisitLogService {
  constructor(
    @InjectRepository(VisitLog)
    private readonly visitLogRepository: Repository<VisitLog>,
  ) {}

  /**
   * 创建访问日志
   */
  async create(visitLog: Partial<VisitLog>): Promise<VisitLog> {
    const newLog = this.visitLogRepository.create(visitLog);
    return this.visitLogRepository.save(newLog);
  }

  /**
   * 获取访问日志列表
   */
  async findAll(page = 1, limit = 10): Promise<{ items: VisitLog[]; total: number }> {
    const [items, total] = await this.visitLogRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { items, total };
  }

  /**
   * 获取今日访问量
   */
  async getTodayVisits(): Promise<number> {
    const todayRange = getTodayRange();

    return this.visitLogRepository.count({
      where: {
        createdAt: todayRange,
      },
    });
  }

  /**
   * 获取总访问量
   */
  async getTotalVisits(): Promise<number> {
    return this.visitLogRepository.count();
  }

  /**
   * 获取近7天的访问统计
   */
  async getWeeklyVisits(): Promise<{ date: string; count: number }[]> {
    const result = [];
    const recentDays = getRecentDays(7);

    for (const date of recentDays) {
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);

      const count = await this.visitLogRepository.count({
        where: {
          createdAt: Between(date, nextDate),
        },
      });

      result.push({
        date: formatDate(date),
        count,
      });
    }

    return result;
  }
}
