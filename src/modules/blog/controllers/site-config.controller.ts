import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SiteConfigService } from '../services/site-config.service';
import { SiteConfig } from '../entities/site-config.entity';

@ApiTags('站点配置')
@Controller('site-config')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Post()
  @ApiOperation({ summary: '创建配置' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() siteConfig: Partial<SiteConfig>): Promise<SiteConfig> {
    return this.siteConfigService.create(siteConfig);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新配置' })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: number,
    @Body() siteConfig: Partial<SiteConfig>,
  ): Promise<SiteConfig> {
    return this.siteConfigService.update(id, siteConfig);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除配置' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.siteConfigService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有配置' })
  @UseGuards(JwtAuthGuard)
  async findAll(): Promise<SiteConfig[]> {
    return this.siteConfigService.findAll();
  }

  @Get('frontend')
  @ApiOperation({ summary: '获取前端可见的配置' })
  async findFrontendConfigs(): Promise<SiteConfig[]> {
    return this.siteConfigService.findFrontendConfigs();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取配置详情' })
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: number): Promise<SiteConfig> {
    return this.siteConfigService.findById(id);
  }

  @Post('batch')
  @ApiOperation({ summary: '批量更新配置' })
  @UseGuards(JwtAuthGuard)
  async updateBatch(@Body() configs: { name: string; value: string }[]): Promise<void> {
    return this.siteConfigService.updateBatch(configs);
  }
}
