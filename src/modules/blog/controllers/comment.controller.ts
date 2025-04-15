import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CommentService } from '../services/comment.service';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Comment } from '../entities/comment.entity';

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '创建评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(@Body() comment: Partial<Comment>, @Req() req): Promise<ResultDto<Comment>> {
    comment.userId = req.user.id;

    const newComment = await this.commentService.create(comment);
    return ResultDto.success(newComment);
  }

  @Get()
  @ApiOperation({ summary: '获取评论列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'articleId', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('articleId') articleId?: number,
  ): Promise<ResultDto<{ items: Comment[]; total: number }>> {
    const result = await this.commentService.findAll(page, limit, articleId);
    return ResultDto.success(result);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评论详情' })
  async findOne(@Param('id') id: number): Promise<ResultDto<Comment>> {
    const comment = await this.commentService.findById(id);
    return ResultDto.success(comment);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id') id: number,
    @Body() comment: Partial<Comment>,
  ): Promise<ResultDto<Comment>> {
    const updatedComment = await this.commentService.update(id, comment);
    return ResultDto.success(updatedComment);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<ResultDto<null>> {
    await this.commentService.remove(id);
    return ResultDto.success(null);
  }
}
