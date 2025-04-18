import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { TagService } from '../services/tag.service';
import { Tag } from '../entities/tag.entity';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Public } from '../../../common/decorators/public.decorator';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { VisitLog } from '../../../common/decorators/visit-log.decorator';

// 前台标签接口
@ApiTags('标签')
@Controller('tags')
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Post()
  @ApiOperation({ summary: '创建标签' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() tag: Partial<Tag>): Promise<ResultDto<Tag>> {
    const result = await this.tagService.create(tag);
    return ResultDto.success(result);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新标签' })
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() tag: Partial<Tag>): Promise<ResultDto<Tag>> {
    const result = await this.tagService.update(id, tag);
    return ResultDto.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除标签' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<ResultDto<null>> {
    await this.tagService.remove(id);
    return ResultDto.success(null);
  }

  @Get()
  @ApiOperation({ summary: '获取所有标签' })
  @Public()
  @VisitLog('文章标签')
  async findAll(): Promise<ResultDto<Tag[]>> {
    const result = await this.tagService.findAll();
    return ResultDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取指定标签' })
  @Public()
  async findOne(@Param('id') id: number): Promise<ResultDto<Tag>> {
    const result = await this.tagService.findById(id);
    return ResultDto.success(result);
  }
}

// 后台标签管理接口
@ApiTags('后台标签管理')
@Controller('admin/tag')
@UseGuards(JwtAuthGuard)
export class AdminTagController {
  constructor(private readonly tagService: TagService) {}

  @Get('list')
  @ApiOperation({ summary: '查看后台标签列表' })
  async listTagBackVO(
    @Query() query: any,
  ): Promise<ResultDto<{ recordList: Tag[]; count: number }>> {
    const { current = 1, size = 10, keyword } = query;
    const result = await this.tagService.findByPage(+current, +size, keyword);
    return ResultDto.success(result);
  }

  @Post('add')
  @ApiOperation({ summary: '添加标签' })
  @OperationLog(OperationType.CREATE)
  async addTag(@Body() tag: Partial<Tag>): Promise<ResultDto<Tag>> {
    const result = await this.tagService.create(tag);
    return ResultDto.success(result);
  }

  @Delete('delete')
  @ApiOperation({ summary: '删除标签' })
  @OperationLog(OperationType.DELETE)
  async deleteTag(@Body() tagIdList: number[]): Promise<ResultDto<null>> {
    await this.tagService.removeMultiple(tagIdList);
    return ResultDto.success(null, '删除成功');
  }

  @Put('update')
  @ApiOperation({ summary: '修改标签' })
  @OperationLog(OperationType.UPDATE)
  async updateTag(@Body() tag: Partial<Tag>): Promise<ResultDto<Tag>> {
    const result = await this.tagService.update(tag.id, tag);
    return ResultDto.success(result);
  }

  @Get('option')
  @ApiOperation({ summary: '查看标签选项' })
  async listTagOption(): Promise<ResultDto<Tag[]>> {
    const result = await this.tagService.findAll();
    return ResultDto.success(result);
  }
}
