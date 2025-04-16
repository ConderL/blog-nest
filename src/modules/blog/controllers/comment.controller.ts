import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Comment } from '../entities/comment.entity';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '创建评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.CREATE)
  async create(@Body() createCommentDto: any, @Req() req: any): Promise<ResultDto<Comment>> {
    const { user } = req;

    const comment: Partial<Comment> = {
      content: createCommentDto.content,
      articleId: createCommentDto.articleId,
      parentId: createCommentDto.parentId || 0,
      replyId: createCommentDto.replyId || 0,
      userId: user.userId,
    };

    const result = await this.commentService.create(comment);
    return ResultDto.success(result);
  }

  /**
   * 获取评论列表
   */
  @Get()
  @ApiOperation({ summary: '获取评论列表' })
  async findAll(@Query() query): Promise<ResultDto<{ commentList: Comment[]; count: number }>> {
    const { page = 1, limit = 10, articleId } = query;
    const [comments, count] = await this.commentService.findAll(page, limit, articleId);
    return ResultDto.success({ commentList: comments, count });
  }

  /**
   * 获取文章评论列表(含子评论)
   */
  @Get('article/:articleId')
  @ApiOperation({ summary: '获取指定文章的评论树' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  async getArticleComments(@Param('articleId') articleId: number): Promise<ResultDto<Comment[]>> {
    const comments = await this.commentService.findByArticleId(articleId);
    return ResultDto.success(comments);
  }

  @Get(':id')
  @ApiOperation({ summary: '查询评论详情' })
  async findById(@Param('id') id: string): Promise<ResultDto<Comment>> {
    const result = await this.commentService.findById(+id);
    return ResultDto.success(result);
  }

  @Get('tree/:articleId')
  @ApiOperation({ summary: '查询评论树' })
  async findTree(@Param('articleId') articleId: string): Promise<ResultDto<Comment[]>> {
    const result = await this.commentService.findTree(+articleId);
    return ResultDto.success(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.UPDATE)
  async update(
    @Param('id') id: string,
    @Body() updateCommentDto: any,
  ): Promise<ResultDto<Comment>> {
    const result = await this.commentService.update(+id, updateCommentDto);
    return ResultDto.success(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.DELETE)
  async remove(@Param('id') id: string): Promise<ResultDto<null>> {
    await this.commentService.remove(+id);
    return ResultDto.success(null);
  }
}
