import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CategoryService } from '../services/category.service';
import { Category } from '../entities/category.entity';

@ApiTags('分类管理')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() category: Partial<Category>): Promise<Category> {
    return this.categoryService.create(category);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() category: Partial<Category>): Promise<Category> {
    return this.categoryService.update(id, category);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.categoryService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有分类' })
  async findAll(): Promise<Category[]> {
    return this.categoryService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: '获取分类树' })
  async findTree(): Promise<Category[]> {
    return this.categoryService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定分类' })
  async findOne(@Param('id') id: number): Promise<Category> {
    return this.categoryService.findById(id);
  }
}
