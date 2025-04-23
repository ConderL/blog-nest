import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from '../entities/site-config.entity';

/**
 * 网站配置服务
 */
@Injectable()
export class SiteConfigService {
  private readonly logger = new Logger(SiteConfigService.name);

  constructor(
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
  ) {}

  /**
   * 获取网站配置列表
   */
  async findAll(): Promise<SiteConfig[]> {
    this.logger.log('获取网站配置列表');
    return this.siteConfigRepository.find();
  }

  /**
   * 获取网站配置详情
   * @param id 配置ID
   */
  async findById(id: number): Promise<SiteConfig> {
    this.logger.log(`获取网站配置详情: id=${id}`);
    return this.siteConfigRepository.findOne({ where: { id } });
  }

  /**
   * 创建网站配置
   * @param siteConfig 网站配置数据
   */
  async create(siteConfig: Partial<SiteConfig>): Promise<SiteConfig> {
    this.logger.log(`创建网站配置: ${JSON.stringify(siteConfig)}`);
    // 手动设置创建时间和更新时间
    const now = new Date();
    const newSiteConfig = this.siteConfigRepository.create({
      ...siteConfig,
      createTime: now,
      updateTime: now,
    });
    return this.siteConfigRepository.save(newSiteConfig);
  }

  /**
   * 更新网站配置
   * @param id 配置ID
   * @param siteConfig 网站配置数据
   */
  async update(id: number, siteConfig: Partial<SiteConfig>): Promise<SiteConfig> {
    this.logger.log(`更新网站配置: id=${id}, ${JSON.stringify(siteConfig)}`);
    // 更新时间
    siteConfig.updateTime = new Date();
    await this.siteConfigRepository.update(id, siteConfig);
    return this.findById(id);
  }

  /**
   * 删除网站配置
   * @param id 配置ID
   */
  async remove(id: number): Promise<void> {
    this.logger.log(`删除网站配置: id=${id}`);
    await this.siteConfigRepository.delete(id);
  }
}
