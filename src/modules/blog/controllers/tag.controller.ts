import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TagService } from '../services/tag.service';
import { Tag } from '../entities/tag.entity';

@ApiTags('标签管理')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: '创建标签' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() tag: Partial<Tag>): Promise<Tag> {
    return this.tagService.create(tag);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新标签' })
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() tag: Partial<Tag>): Promise<Tag> {
    return this.tagService.update(id, tag);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.tagService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  async findAll(): Promise<Tag[]> {
    return this.tagService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定标签' })
  async findOne(@Param('id') id: number): Promise<Tag> {
    return this.tagService.findById(id);
  }
}
