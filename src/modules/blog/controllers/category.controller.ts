import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CategoryService } from '../services/category.service';
import { Category } from '../entities/category.entity';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { VisitLog } from '../../../common/decorators/visit-log.decorator';

// 前台分类接口
@ApiTags('分类')
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: '创建分类' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() category: Partial<Category>): Promise<ResultDto<Category>> {
    const result = await this.categoryService.create(category);
    return ResultDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新分类' })
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: number,
    @Body() category: Partial<Category>,
  ): Promise<ResultDto<Category>> {
    const result = await this.categoryService.update(id, category);
    return ResultDto.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除分类' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<ResultDto<null>> {
    await this.categoryService.remove(id);
    return ResultDto.success(null);
  }

  @Get()
  @ApiOperation({ summary: '获取所有分类' })
  @Public()
  @VisitLog('文章分类')
  async findAll(): Promise<ResultDto<Category[]>> {
    const result = await this.categoryService.findAll();
    return ResultDto.success(result);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取分类树' })
  @Public()
  async findTree(): Promise<ResultDto<Category[]>> {
    const result = await this.categoryService.findTree();
    return ResultDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定分类' })
  @Public()
  async findOne(@Param('id') id: number): Promise<ResultDto<Category>> {
    const result = await this.categoryService.findById(id);
    return ResultDto.success(result);
  }
}

// 后台分类管理接口
@ApiTags('后台分类管理')
@Controller('admin/category')
@UseGuards(JwtAuthGuard)
export class AdminCategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get('list')
  @ApiOperation({ summary: '查看后台分类列表' })
  async listCategoryBackVO(
    @Query() query: any,
  ): Promise<ResultDto<{ recordList: Category[]; count: number }>> {
    const { current = 1, size = 10, keyword } = query;
    const result = await this.categoryService.findByPage(+current, +size, keyword);
    return ResultDto.success(result);
  }

  @Post('add')
  @ApiOperation({ summary: '添加分类' })
  @OperationLog(OperationType.CREATE)
  async addCategory(@Body() category: Partial<Category>): Promise<ResultDto<Category>> {
    const result = await this.categoryService.create(category);
    return ResultDto.success(result);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除分类' })
  @OperationLog(OperationType.DELETE)
  async deleteCategory(@Body() categoryIdList: number[]): Promise<ResultDto<null>> {
    await this.categoryService.removeMultiple(categoryIdList);
    return ResultDto.success(null, '删除成功');
  }

  @Put('update')
  @ApiOperation({ summary: '修改分类' })
  @OperationLog(OperationType.UPDATE)
  async updateCategory(@Body() category: Partial<Category>): Promise<ResultDto<Category>> {
    const result = await this.categoryService.update(category.id, category);
    return ResultDto.success(result);
  }

  @Get('option')
  @ApiOperation({ summary: '查看分类选项' })
  async listCategoryOption(): Promise<ResultDto<Category[]>> {
    const result = await this.categoryService.findAll();
    return ResultDto.success(result);
  }
}
