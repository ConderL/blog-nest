import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Article } from '../entities/article.entity';
import { Category } from '../entities/category.entity';
import { Tag } from '../entities/tag.entity';
import { Comment } from '../entities/comment.entity';
import { User } from '../../user/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { VisitLogService } from './visit-log.service';
import { IPUtil } from '../../../common/utils/ip.util';

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
    const url = req.url || req.originalUrl || '/';

    // 创建访问日志
    const visitLog = {
      ipAddress,
      ipSource: await IPUtil.getIpSource(ipAddress),
      browser: this.getBrowserName(userAgent),
      os: this.getOsInfo(userAgent),
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

    // 获取总访问量
    const viewCount = await this.visitLogService.countTotalVisits();

    // 获取网站配置信息
    const siteConfig = {
      id: 1,
      userAvatar: 'http://img.conder.top/config/avatar.jpg',
      touristAvatar: 'http://img.conder.top/config/default_avatar.jpg',
      siteName: "Conder's blog",
      siteAddress: 'https://www.conder.top',
      siteIntro: '每天进步一点点。',
      siteNotice: '后端基于NestJs开发，前端基于Vue3 Ts Navie UI开发',
      createSiteTime: '2025-5-20',
      recordNumber: '豫ICP备2024068028号-1',
      authorAvatar: 'http://img.conder.top/config/avatar.jpg',
      siteAuthor: '@ConderL',
      articleCover: 'https://picture.qiuyu.wiki/config/a309572c1e5f943ec6e6eff445b0f14d.jpg',
      aboutMe: '\uD83C\uDF40个人简介\n\n全栈开发工程师\n\n喜欢捣鼓一些新奇的东西',
      github: 'https://github.com/ConderL',
      bilibili: 'https://space.bilibili.com/180248324',
      qq: '912277676',
      commentCheck: 0,
      messageCheck: 0,
      isReward: 1,
      weiXinCode: 'https://picture.qiuyu.wiki/config/747ea3a1cad627c4384fb5f19b78d96d.jpg',
      aliCode: 'https://picture.qiuyu.wiki/config/96535c4e348bb5d6e16b42086fcdca39.jpg',
      emailNotice: 1,
      socialList: 'github,qq,bilibili',
      // loginList: 'qq,gitee,github',
      loginList: '',
      isMusic: 1,
      musicId: '691394551',
      isChat: 1,
      websocketUrl: 'wss://www.conder.top/websocket/',
      archiveWallpaper: 'https://picture.qiuyu.wiki/config/4343ce0c8ea2d5389ec8dfb1643d562c.jpg',
      categoryWallpaper: 'https://picture.qiuyu.wiki/config/6a41b24a35f31690b048c651906ef714.png',
      tagWallpaper: 'https://picture.qiuyu.wiki/config/4769c73d1745ff3b978867bf551fe6c7.jpg',
      talkWallpaper: 'https://picture.qiuyu.wiki/config/5a08159479ba344dec5813e61fb6f79c.png',
      albumWallpaper: 'https://picture.qiuyu.wiki/config/911b382d5b990b23c95104f965524880.png',
      friendWallpaper: 'https://picture.qiuyu.wiki/config/1b64e99e7c3a0a954f8ed4632e58a968.png',
      messageWallpaper: 'https://picture.qiuyu.wiki/config/a2d126855bbeb3353abafc9047c0fd15.png',
      aboutWallpaper: 'https://picture.qiuyu.wiki/config/5efb247a6e443d6c9036baa78db14044.png',
    };

    return {
      articleCount,
      categoryCount,
      tagCount,
      viewCount: viewCount.toString(),
      siteConfig,
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
