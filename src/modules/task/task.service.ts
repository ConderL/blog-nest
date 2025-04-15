import { Injectable, Logger } from '@nestjs/common';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Article } from '../blog/entities/article.entity';
import { VisitLog } from '../blog/entities/visit-log.entity';
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

const execAsync = promisify(exec);

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(
    private schedulerRegistry: SchedulerRegistry,
    @InjectRepository(Article)
    private readonly articleRepository: Repository<Article>,
    @InjectRepository(VisitLog)
    private readonly visitLogRepository: Repository<VisitLog>,
  ) {
    this.logger.log('TaskService initialized');
  }

  /**
   * 每天凌晨3点执行数据库备份
   */
  @Cron('0 0 3 * * *')
  async handleDatabaseBackup() {
    this.logger.log('执行数据库备份');
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const backupFileName = `backup_${timestamp}.sql`;
      const backupFilePath = path.join(backupDir, backupFileName);

      // 使用环境变量获取数据库连接信息
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '3306';
      const dbUser = process.env.DB_USERNAME || 'root';
      const dbPassword = process.env.DB_PASSWORD || 'root';
      const dbName = process.env.DB_DATABASE || 'blog';

      // 执行备份命令
      const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > ${backupFilePath}`;
      await execAsync(command);

      this.logger.log(`数据库备份成功：${backupFilePath}`);

      // 删除7天前的备份
      const files = fs.readdirSync(backupDir);
      const now = moment();

      for (const file of files) {
        if (file.startsWith('backup_') && file.endsWith('.sql')) {
          const filePath = path.join(backupDir, file);
          const fileDate = moment(file.substring(7, 17), 'YYYY-MM-DD');

          if (now.diff(fileDate, 'days') > 7) {
            fs.unlinkSync(filePath);
            this.logger.log(`删除过期备份：${filePath}`);
          }
        }
      }
    } catch (error) {
      this.logger.error('数据库备份失败', error);
    }
  }

  /**
   * 每小时执行一次访问统计
   */
  @Cron('0 0 * * * *')
  async handleHourlyVisitStats() {
    this.logger.log('执行每小时访问统计');
    try {
      const now = new Date();
      const hourRange = getHourRange(now);

      const count = await this.visitLogRepository.count({
        where: {
          createdAt: hourRange,
        },
      });

      const hourStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        0,
        0,
      );
      const hourEnd = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        59,
        59,
      );

      this.logger.log(
        `${hourStart.toLocaleString()} 至 ${hourEnd.toLocaleString()} 访问量：${count}`,
      );

      // 这里可以将统计数据保存到数据库或其他存储
    } catch (error) {
      this.logger.error('访问统计失败', error);
    }
  }

  /**
   * 每天凌晨2点执行数据清理
   */
  @Cron('0 0 2 * * *')
  async handleDataCleanup() {
    this.logger.log('执行数据清理');
    try {
      // 删除30天前的访问日志
      const beforeCondition = getBeforeDays(30);

      const result = await this.visitLogRepository.delete({
        createdAt: beforeCondition,
      });

      this.logger.log(`已清理 ${result.affected} 条过期访问日志`);
    } catch (error) {
      this.logger.error('数据清理失败', error);
    }
  }

  /**
   * 手动触发备份
   */
  async manualBackup(): Promise<string> {
    this.logger.log('手动触发数据库备份');
    try {
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = moment().format('YYYY-MM-DD_HH-mm-ss');
      const backupFileName = `manual_backup_${timestamp}.sql`;
      const backupFilePath = path.join(backupDir, backupFileName);

      // 使用环境变量获取数据库连接信息
      const dbHost = process.env.DB_HOST || 'localhost';
      const dbPort = process.env.DB_PORT || '3306';
      const dbUser = process.env.DB_USERNAME || 'root';
      const dbPassword = process.env.DB_PASSWORD || 'root';
      const dbName = process.env.DB_DATABASE || 'blog';

      // 执行备份命令
      const command = `mysqldump -h ${dbHost} -P ${dbPort} -u ${dbUser} -p${dbPassword} ${dbName} > ${backupFilePath}`;
      await execAsync(command);

      this.logger.log(`手动数据库备份成功：${backupFilePath}`);
      return backupFilePath;
    } catch (error) {
      this.logger.error('手动数据库备份失败', error);
      throw error;
    }
  }

  /**
   * 获取统计摘要
   */
  async getStatsSummary(): Promise<any> {
    try {
      // 文章总数
      const articleCount = await this.articleRepository.count({
        where: { isDelete: 0 },
      });

      // 今日访问量
      const todayRange = getTodayRange();
      const todayVisits = await this.visitLogRepository.count({
        where: {
          createdAt: todayRange,
        },
      });

      // 总访问量
      const totalVisits = await this.visitLogRepository.count();

      // 7天内访问趋势
      const weeklyVisits = [];
      const recentDays = getRecentDays(7);

      for (let i = 0; i < recentDays.length; i++) {
        const date = recentDays[i];
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1);

        const count = await this.visitLogRepository.count({
          where: {
            createdAt: Between(date, nextDate),
          },
        });

        weeklyVisits.push({
          date: formatDate(date),
          count,
        });
      }

      return {
        articleCount,
        todayVisits,
        totalVisits,
        weeklyVisits,
      };
    } catch (error) {
      this.logger.error('获取统计摘要失败', error);
      throw error;
    }
  }
}
