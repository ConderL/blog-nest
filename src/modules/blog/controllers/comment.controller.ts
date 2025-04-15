import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CommentService } from '../services/comment.service';
import { Comment } from '../entities/comment.entity';

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  @ApiOperation({ summary: '创建评论' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() comment: Partial<Comment>, @Request() req): Promise<Comment> {
    comment.fromUid = req.user.id;
    return this.commentService.create(comment);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除评论' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.commentService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取评论列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'typeId', required: false })
  @ApiQuery({ name: 'commentType', required: false })
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('typeId') typeId?: number,
    @Query('commentType') commentType?: number,
  ): Promise<{ items: Comment[]; total: number }> {
    return this.commentService.findAll(page, limit, typeId, commentType);
  }

  @Get('tree')
  @ApiOperation({ summary: '获取评论树' })
  @ApiQuery({ name: 'typeId', required: true })
  @ApiQuery({ name: 'commentType', required: true })
  async findTree(
    @Query('typeId') typeId: number,
    @Query('commentType') commentType: number,
  ): Promise<Comment[]> {
    return this.commentService.findTree(typeId, commentType);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取评论详情' })
  async findOne(@Param('id') id: number): Promise<Comment> {
    return this.commentService.findById(id);
  }
}
