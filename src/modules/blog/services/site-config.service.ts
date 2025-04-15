import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteConfig } from '../entities/site-config.entity';

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfig)
    private readonly siteConfigRepository: Repository<SiteConfig>,
  ) {}

  /**
   * 创建配置
   */
  async create(siteConfig: Partial<SiteConfig>): Promise<SiteConfig> {
    const newConfig = this.siteConfigRepository.create(siteConfig);
    return this.siteConfigRepository.save(newConfig);
  }

  /**
   * 更新配置
   */
  async update(id: number, siteConfig: Partial<SiteConfig>): Promise<SiteConfig> {
    await this.siteConfigRepository.update(id, siteConfig);
    return this.findById(id);
  }

  /**
   * 删除配置
   */
  async remove(id: number): Promise<void> {
    await this.siteConfigRepository.delete(id);
  }

  /**
   * 获取所有配置
   */
  async findAll(): Promise<SiteConfig[]> {
    return this.siteConfigRepository.find();
  }

  /**
   * 获取前端可见配置
   */
  async findFrontendConfigs(): Promise<SiteConfig[]> {
    return this.siteConfigRepository.find({ where: { isFrontend: 1 } });
  }

  /**
   * 根据ID获取配置
   */
  async findById(id: number): Promise<SiteConfig> {
    return this.siteConfigRepository.findOne({ where: { id } });
  }

  /**
   * 根据配置名获取配置
   */
  async findByName(configName: string): Promise<SiteConfig> {
    return this.siteConfigRepository.findOne({ where: { configName } });
  }

  /**
   * 批量更新配置
   */
  async updateBatch(configs: { name: string; value: string }[]): Promise<void> {
    for (const config of configs) {
      const existConfig = await this.findByName(config.name);
      if (existConfig) {
        await this.siteConfigRepository.update(existConfig.id, { configValue: config.value });
      }
    }
  }
}
