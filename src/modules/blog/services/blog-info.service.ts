import { Injectable, Req } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { Comment } from '../entities/comment.entity';
import { VisitLog } from '../entities/visit-log.entity';
import { User } from '../../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { VisitLogService } from './visit-log.service';
import { Request } from 'express';
import { IPUtil } from '../../../common/utils/ip.util';
import * as moment from 'moment';

/**
 * 博客信息服务
 * 提供博客基本信息统计和访问记录等功能
 */
@Injectable()
export class BlogInfoService {
  constructor(
    @InjectRepository(Article)
    private articleRepository: Repository<Article>,
    @InjectRepository(Category)
    private categoryRepository: Repository<Category>,
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private visitLogService: VisitLogService,
    private configService: ConfigService,
  ) {}

  /**
   * 记录访客信息
   * 获取请求IP、浏览器、操作系统等信息，记录到访问日志
   */
  async report(): Promise<void> {
    // 获取请求对象
    const req = IPUtil.getRequestObject();

    // 从请求对象中获取访客信息
    const userAgent = req.headers['user-agent'];
    const ipAddress = IPUtil.getClientIp(req);
    const referer = req.headers['referer'] || '';
    const url = req.url || req.originalUrl || '/';

    // 创建访问日志
    const visitLog = {
      ipAddress,
      ipSource: await IPUtil.getIpSource(ipAddress),
      browser: this.getBrowserName(userAgent),
      os: this.getOsInfo(userAgent),
      referer,
      pageUrl: url,
    };

    // 保存访问日志
    await this.visitLogService.create(visitLog);
  }

  /**
   * 获取博客基本信息
   * 包括文章数量、分类数量、标签数量和访问统计
   */
  async getBlogInfo() {
    // 获取文章数量
    const articleCount = await this.articleRepository.count({
      where: { isDelete: 0, status: 1 },
    });

    // 获取分类数量
    const categoryCount = await this.categoryRepository.count();

    // 获取标签数量
    const tagCount = await this.tagRepository.count();

    // 获取公开文章总浏览量
    const viewsCount = await this.articleRepository
      .createQueryBuilder('article')
      .where('article.isDelete = :isDelete', { isDelete: 0 })
      .andWhere('article.status = :status', { status: 1 })
      .select('SUM(article.viewCount)', 'viewsCount')
      .getRawOne()
      .then((result) => result.viewsCount || 0);

    // 获取网站配置信息
    const websiteConfig = {
      websiteName: this.configService.get('website.name', 'Conder Blog'),
      websiteAvatar: this.configService.get('website.logo', ''),
      websiteIntro: this.configService.get('website.description', '个人博客系统'),
      websiteNotice: this.configService.get('website.notice', '欢迎来到我的博客'),
      websiteCreateTime: this.configService.get('website.createTime', '2023-01-01'),
      websiteRecordNo: this.configService.get('website.recordNo', ''),
    };

    return {
      articleCount,
      categoryCount,
      tagCount,
      viewsCount,
      websiteConfig,
    };
  }

  /**
   * 获取后台统计信息
   * 包括访问量统计、内容统计和文章状态统计
   */
  async getBlogBackInfo() {
    // 获取访问量数据
    const todayVisitCount = await this.visitLogService.countTodayVisits();
    const totalVisitCount = await this.visitLogService.countTotalVisits();

    // 获取内容数据
    const articleCount = await this.articleRepository.count({ where: { isDelete: 0 } });
    const categoryCount = await this.categoryRepository.count();
    const tagCount = await this.tagRepository.count();
    const commentCount = await this.commentRepository.count({ where: { isReview: 1 } });
    const userCount = await this.userRepository.count();

    // 获取文章统计数据
    const articleStatistics = await this.articleRepository
      .createQueryBuilder('article')
      .select('article.status', 'status')
      .addSelect('COUNT(article.id)', 'count')
      .where('article.isDelete = :isDelete', { isDelete: 0 })
      .groupBy('article.status')
      .getRawMany();

    // 格式化文章统计数据
    const articleStatusCount = {
      published: 0,
      draft: 0,
    };

    articleStatistics.forEach((item) => {
      if (item.status === 1) {
        articleStatusCount.published = parseInt(item.count);
      } else {
        articleStatusCount.draft = parseInt(item.count);
      }
    });

    // 获取一周访问量统计
    const weeklyVisits = await this.visitLogService.getWeeklyVisitStats();

    return {
      visitCount: {
        todayCount: todayVisitCount,
        totalCount: totalVisitCount,
        weeklyVisits,
      },
      contentCount: {
        articleCount,
        categoryCount,
        tagCount,
        commentCount,
        userCount,
      },
      articleStatusCount,
    };
  }

  /**
   * 获取关于我页面内容
   */
  async getAbout() {
    return {
      aboutContent: this.configService.get(
        'about.content',
        '# 关于我\n\n这是一个使用Nest.js构建的个人博客系统。',
      ),
    };
  }

  /**
   * 获取浏览器名称
   * @param userAgent User-Agent字符串
   * @returns 浏览器名称
   */
  private getBrowserName(userAgent: string): string {
    if (!userAgent) return '未知浏览器';

    if (userAgent.includes('Chrome')) {
      return 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      return 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      return 'Safari';
    } else if (userAgent.includes('MSIE') || userAgent.includes('Trident')) {
      return 'IE';
    } else if (userAgent.includes('Edge')) {
      return 'Edge';
    } else if (userAgent.includes('Opera') || userAgent.includes('OPR')) {
      return 'Opera';
    } else {
      return '其他浏览器';
    }
  }

  /**
   * 获取操作系统信息
   * @param userAgent User-Agent字符串
   * @returns 操作系统名称
   */
  private getOsInfo(userAgent: string): string {
    if (!userAgent) return '未知系统';

    if (userAgent.includes('Windows')) {
      return 'Windows';
    } else if (userAgent.includes('Mac OS')) {
      return 'Mac OS';
    } else if (userAgent.includes('Linux')) {
      return 'Linux';
    } else if (userAgent.includes('Android')) {
      return 'Android';
    } else if (
      userAgent.includes('iOS') ||
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      return 'iOS';
    } else {
      return '其他系统';
    }
  }
}
