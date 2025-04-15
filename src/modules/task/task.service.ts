import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan } from 'typeorm';
import { Article } from '../blog/entities/article.entity';
import { VisitLog } from '../log/entities/visit-log.entity';
import {
  getBeforeDays,
  getHourRange,
  getTodayRange,
  getRecentDays,
  formatDate,
} from '../../common/utils/date.utils';
import * as fs from 'fs';
import * as path from 'path';
import * as moment from 'moment';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as config from '../../config/configuration';

const execAsync = promisify(exec);

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);
  private readonly backupDir = path.join(process.cwd(), 'backups');

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(VisitLog)
    private readonly visitLogRepository: Repository<VisitLog>,
  ) {
    this.logger.log('TaskService initialized');
    // 确保备份目录存在
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  /**
   * 每天凌晨3点执行数据库备份
   */
  @Cron('0 0 3 * * *')
  async handleDatabaseBackup() {
    this.logger.log('执行定时数据库备份...');
    await this.performBackup(`backup_${moment().format('YYYY-MM-DD_HH-mm-ss')}.sql`);

    // 保留最近30天的备份
    this.cleanupOldBackups(30);
  }

  /**
   * 每小时执行一次访问统计
   */
  @Cron('0 0 * * * *')
  async handleHourlyVisitStats() {
    this.logger.log('收集小时访问统计...');
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    const visits = await this.visitLogRepository.count({
      where: {
        createdAt: Between(hourAgo, now),
      },
    });

    this.logger.log(`过去一小时的访问量: ${visits}`);
  }

  /**
   * 每天凌晨2点执行数据清理
   */
  @Cron('0 0 2 * * *')
  async handleDataCleanup() {
    this.logger.log('清理过期访问日志...');
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const result = await this.visitLogRepository.delete({
      createdAt: LessThan(thirtyDaysAgo),
    });

    this.logger.log(`已清理 ${result.affected || 0} 条过期访问日志`);
  }

  /**
   * 手动触发备份
   */
  async manualBackup(): Promise<string> {
    const filename = `manual_backup_${moment().format('YYYY-MM-DD_HH-mm-ss')}.sql`;
    await this.performBackup(filename);
    return path.join(this.backupDir, filename);
  }

  /**
   * 执行实际的备份操作
   */
  private async performBackup(filename: string): Promise<void> {
    const dbConfig = config.default().database;
    const backupPath = path.join(this.backupDir, filename);

    try {
      const command = `mysqldump -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.username} -p${dbConfig.password} ${dbConfig.database} > ${backupPath}`;
      await execAsync(command);
      this.logger.log(`数据库备份成功: ${backupPath}`);
    } catch (error) {
      this.logger.error(`数据库备份失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 清理旧备份
   */
  private cleanupOldBackups(days: number): void {
    try {
      const files = fs.readdirSync(this.backupDir);
      const now = moment();

      files.forEach((file) => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        const fileDate = moment(stats.mtime);

        if (now.diff(fileDate, 'days') > days) {
          fs.unlinkSync(filePath);
          this.logger.log(`已删除旧备份: ${file}`);
        }
      });
    } catch (error) {
      this.logger.error(`清理旧备份失败: ${error.message}`);
    }
  }

  /**
   * 获取统计摘要
   */
  async getStatsSummary(): Promise<any> {
    const articleCount = await this.articleRepository.count({
      where: { isDelete: 0 },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayVisits = await this.visitLogRepository.count({
      where: {
        createdAt: Between(today, new Date()),
      },
    });

    const totalVisits = await this.visitLogRepository.count();

    // 获取过去7天的访问趋势
    const weeklyTrend = await this.getWeeklyVisitTrend();

    return {
      articleCount,
      todayVisits,
      totalVisits,
      weeklyTrend,
    };
  }

  /**
   * 获取过去7天的访问趋势
   */
  private async getWeeklyVisitTrend(): Promise<any[]> {
    const result = [];
    const today = moment().startOf('day');

    for (let i = 6; i >= 0; i--) {
      const date = moment(today).subtract(i, 'days');
      const nextDate = moment(date).add(1, 'days');

      const count = await this.visitLogRepository.count({
        where: {
          createdAt: Between(date.toDate(), nextDate.toDate()),
        },
      });

      result.push({
        date: date.format('YYYY-MM-DD'),
        count,
      });
    }

    return result;
  }

  /**
   * 获取备份文件列表
   */
  async getBackupList(): Promise<any[]> {
    try {
      const files = fs.readdirSync(this.backupDir);

      return files
        .map((file) => {
          const filePath = path.join(this.backupDir, file);
          const stats = fs.statSync(filePath);

          return {
            filename: file,
            size: stats.size,
            createdAt: stats.mtime,
            path: filePath,
          };
        })
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); // 按时间倒序
    } catch (error) {
      this.logger.error(`获取备份列表失败: ${error.message}`);
      return [];
    }
  }

  /**
   * 删除指定备份文件
   */
  async deleteBackup(filename: string): Promise<boolean> {
    try {
      const filePath = path.join(this.backupDir, filename);

      // 安全检查 - 确保文件在备份目录内
      if (!filePath.startsWith(this.backupDir) || !fs.existsSync(filePath)) {
        return false;
      }

      fs.unlinkSync(filePath);
      this.logger.log(`已删除备份文件: ${filename}`);
      return true;
    } catch (error) {
      this.logger.error(`删除备份文件失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 获取访问统计数据
   */
  async getVisitStats(period: string = 'week'): Promise<any> {
    let startDate: Date;
    const endDate = new Date();
    const today = moment().startOf('day');

    switch (period) {
      case 'day':
        startDate = today.toDate();
        break;
      case 'month':
        startDate = moment().subtract(30, 'days').startOf('day').toDate();
        break;
      case 'week':
      default:
        startDate = moment().subtract(7, 'days').startOf('day').toDate();
        break;
    }

    // 获取时间段内的每日访问量
    const dailyStats = await this.getDailyVisitStats(startDate, endDate);

    // 获取访问量最高的IP来源
    const topIPs = await this.getTopIPs(startDate, endDate);

    // 获取访问量最高的页面
    const topPages = await this.getTopPages(startDate, endDate);

    return {
      period,
      dailyStats,
      topIPs,
      topPages,
    };
  }

  /**
   * 获取每日访问统计
   */
  private async getDailyVisitStats(startDate: Date, endDate: Date): Promise<any[]> {
    const result = [];
    let current = moment(startDate).startOf('day');
    const end = moment(endDate).startOf('day');

    while (current.isSameOrBefore(end)) {
      const nextDay = moment(current).add(1, 'days');

      const count = await this.visitLogRepository.count({
        where: {
          createdAt: Between(current.toDate(), nextDay.toDate()),
        },
      });

      result.push({
        date: current.format('YYYY-MM-DD'),
        count,
      });

      current = nextDay;
    }

    return result;
  }

  /**
   * 获取访问量最高的IP
   */
  private async getTopIPs(startDate: Date, endDate: Date, limit: number = 10): Promise<any[]> {
    const result = await this.visitLogRepository
      .createQueryBuilder('visitLog')
      .select('visitLog.ip')
      .addSelect('COUNT(*)', 'count')
      .where('visitLog.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('visitLog.ip')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result;
  }

  /**
   * 获取访问量最高的页面
   */
  private async getTopPages(startDate: Date, endDate: Date, limit: number = 10): Promise<any[]> {
    const result = await this.visitLogRepository
      .createQueryBuilder('visitLog')
      .select('visitLog.pageUrl')
      .addSelect('COUNT(*)', 'count')
      .where('visitLog.createdAt BETWEEN :startDate AND :endDate', { startDate, endDate })
      .groupBy('visitLog.pageUrl')
      .orderBy('count', 'DESC')
      .limit(limit)
      .getRawMany();

    return result;
  }

  /**
   * 获取内容统计数据
   */
  async getContentStats(): Promise<any> {
    // 文章数量统计
    const totalArticles = await this.articleRepository.count({
      where: { isDelete: 0 },
    });

    const publishedArticles = await this.articleRepository.count({
      where: { isDelete: 0, status: 1 },
    });

    const draftArticles = await this.articleRepository.count({
      where: { isDelete: 0, status: 0 },
    });

    // 分类统计
    const categoryStats = await this.articleRepository.query(`
      SELECT c.name, COUNT(a.id) as count
      FROM category c
      LEFT JOIN article a ON a.categoryId = c.id AND a.isDelete = 0
      GROUP BY c.id
      ORDER BY count DESC
    `);

    // 标签统计
    const tagStats = await this.articleRepository.query(`
      SELECT t.name, COUNT(DISTINCT at.articleId) as count
      FROM tag t
      LEFT JOIN article_tag at ON at.tagId = t.id
      LEFT JOIN article a ON at.articleId = a.id AND a.isDelete = 0
      GROUP BY t.id
      ORDER BY count DESC
      LIMIT 10
    `);

    // 按月份统计文章数量
    const monthlyArticles = await this.getMonthlyArticleStats();

    return {
      articles: {
        total: totalArticles,
        published: publishedArticles,
        draft: draftArticles,
      },
      categories: categoryStats,
      tags: tagStats,
      monthlyArticles,
    };
  }

  /**
   * 获取按月统计的文章数量
   */
  private async getMonthlyArticleStats(): Promise<any[]> {
    // 获取最近12个月的数据
    const result = [];
    const today = moment().startOf('month');

    for (let i = 11; i >= 0; i--) {
      const month = moment(today).subtract(i, 'months');
      const startDate = month.clone().startOf('month').toDate();
      const endDate = month.clone().endOf('month').toDate();

      const count = await this.articleRepository.count({
        where: {
          createdAt: Between(startDate, endDate),
          isDelete: 0,
        },
      });

      result.push({
        month: month.format('YYYY-MM'),
        count,
      });
    }

    return result;
  }
}
