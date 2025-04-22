import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Comment } from '../entities/comment.entity';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { UserService } from '../../../modules/user/user.service';

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(
    private readonly commentService: CommentService,
    private readonly userService: UserService,
  ) {}

  @Post('add')
  @ApiOperation({ summary: '创建评论' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @OperationLog(OperationType.CREATE)
  async create(@Body() createCommentDto: any, @Req() req: any): Promise<ResultDto<Comment>> {
    try {
      console.log('创建评论请求:', createCommentDto);
      console.log('请求用户信息:', req.user);

      // 确保能获取到用户ID
      const userId = req.user?.id || req.user?.userId || req.user?.sub;

      if (!userId) {
        console.error('无法获取用户ID，用户数据:', req.user);
        return ResultDto.fail('无法获取用户ID，请重新登录');
      }

      // 根据请求体构建评论数据
      const comment: Partial<Comment> = {
        content: createCommentDto.commentContent || createCommentDto.content,
        typeId: createCommentDto.typeId,
        commentType: createCommentDto.commentType || 1, // 默认为文章评论
        parentId: createCommentDto.parentId || 0,
        replyId: createCommentDto.replyId || 0,
        toUid: createCommentDto.toUid || 0,
        userId: userId,
        isReview: 1, // 默认已审核
      };

      console.log('构建的评论数据:', comment);

      const result = await this.commentService.create(comment);
      return ResultDto.success(result, '评论成功');
    } catch (error) {
      console.error('创建评论失败:', error);
      return ResultDto.fail('创建评论失败: ' + error.message);
    }
  }

  /**
   * 获取评论列表
   */
  @Get('list')
  @ApiOperation({ summary: '获取评论列表' })
  async findAll(@Query() query): Promise<ResultDto<{ recordList: any[]; count: number }>> {
    try {
      // 解析并验证查询参数
      const page = Number(query.current) || Number(query.page) || 1;
      const limit = Number(query.size) || Number(query.limit) || 10;

      // 处理类型ID
      const typeId = query.typeId ? Number(query.typeId) : null;
      // 处理评论类型
      const commentType = query.commentType !== undefined ? Number(query.commentType) : null;

      console.log(
        `获取评论列表: page=${page}, limit=${limit}, typeId=${typeId}, commentType=${commentType}`,
      );

      // 调用服务获取评论列表
      const [comments, count] = await this.commentService.findAll(page, limit, typeId, commentType);

      // 格式化主评论
      const formattedComments = [];

      // 处理每条评论，获取其回复列表
      for (const comment of comments) {
        // 查询该评论的回复列表（限制3条）
        const replies = await this.commentService.getReplies(comment.id, 1, 3);
        const replyCount = await this.commentService.getReplyCount(comment.id);

        // 格式化回复列表
        const replyVOList = [];

        // 为每条回复获取被回复用户的昵称
        for (const reply of replies) {
          let toNickname = '';

          // 如果有指定回复用户ID，查找被回复用户
          if (reply.toUid) {
            try {
              const toUser = await this.userService.findById(reply.toUid);
              if (toUser) {
                toNickname = toUser.nickname || toUser.username || '未知用户';
              }
            } catch (error) {
              console.error(`获取被回复用户昵称失败，用户ID: ${reply.toUid}`, error);
            }
          } else {
            // 如果没有指定回复用户ID，则是回复主评论，获取主评论用户昵称
            toNickname = comment.user?.nickname || comment.user?.username || '未知用户';
          }

          replyVOList.push({
            id: reply.id,
            fromNickname: reply.user?.nickname || reply.user?.username || '匿名用户',
            fromUid: reply.userId,
            avatar: reply.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
            toUid: reply.toUid || comment.userId, // 如果没有指定，则使用主评论用户ID
            toNickname: toNickname,
            commentContent: reply.content,
            createTime: reply.createTime,
            likeCount: 0, // 默认点赞数量为0
          });
        }

        // 添加格式化后的评论
        formattedComments.push({
          id: comment.id,
          fromNickname: comment.user?.nickname || comment.user?.username || '匿名用户',
          fromUid: comment.userId,
          avatar: comment.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
          commentContent: comment.content,
          createTime: comment.createTime,
          likeCount: 0, // 默认点赞数量为0
          replyCount: replyCount, // 实际回复数量
          replyVOList: replyVOList, // 前3条回复列表
        });
      }

      return ResultDto.success({
        recordList: formattedComments,
        count,
        current: page,
        size: limit,
        total: count,
      });
    } catch (error) {
      console.error('获取评论列表失败:', error);
      return ResultDto.fail('获取评论列表失败: ' + error.message);
    }
  }

  /**
   * 获取最新评论
   */
  @Get('recent')
  @ApiOperation({ summary: '获取最新评论' })
  async getRecentComments(): Promise<ResultDto<any>> {
    try {
      console.log('接收到获取最新评论请求');
      const comment = await this.commentService.getRecentComments();

      if (!comment) {
        return ResultDto.success(null, '暂无评论');
      }

      // 格式化评论数据
      const formattedComment = {
        id: comment.id,
        comment_content: comment.content,
        create_time: comment.createTime,
        from_uid: comment.userId,
        type_id: comment.typeId,
        comment_type: comment.commentType,
        user: comment.user
          ? {
              id: comment.user.id,
              nickname: comment.user.nickname || comment.user.username,
              avatar: comment.user.avatar || '',
            }
          : null,
        article: comment.article
          ? {
              id: comment.article.id,
              article_title: comment.article.articleTitle || '未知文章',
            }
          : null,
      };

      console.log('成功获取最新评论');
      return ResultDto.success(formattedComment);
    } catch (error) {
      console.error('获取最新评论失败:', error);
      return ResultDto.fail('获取最新评论失败: ' + error.message);
    }
  }

  /**
   * 获取文章评论列表(含子评论)
   */
  @Get('article/:articleId')
  @ApiOperation({ summary: '获取指定文章的评论树' })
  @ApiParam({ name: 'articleId', description: '文章ID' })
  async getArticleComments(@Param('articleId') articleId: number): Promise<ResultDto<any[]>> {
    try {
      console.log(`获取文章评论树, 文章ID: ${articleId}`);
      const comments = await this.commentService.findByArticleId(articleId);

      // 转换为前端期望的格式
      const formattedComments = comments.map((comment) => {
        // 格式化子评论
        const replyVOList =
          comment.children?.map((reply) => ({
            id: reply.id,
            fromNickname: reply.user?.nickname || reply.user?.username || '匿名用户',
            fromUid: reply.userId,
            avatar: reply.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
            toUid: reply.toUid,
            toNickname: '', // 需要单独获取
            commentContent: reply.content,
            createTime: reply.createTime,
            likeCount: 0, // 默认点赞数量为0
          })) || [];

        // 格式化主评论
        return {
          id: comment.id,
          fromNickname: comment.user?.nickname || comment.user?.username || '匿名用户',
          fromUid: comment.userId,
          avatar: comment.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
          commentContent: comment.content,
          createTime: comment.createTime,
          likeCount: 0, // 默认点赞数量为0，实际应从点赞表中获取
          replyCount: comment['replyCount'] || comment.children?.length || 0,
          replyVOList: replyVOList,
        };
      });

      console.log(`格式化后的评论树结果: ${formattedComments.length}条评论`);
      return ResultDto.success(formattedComments);
    } catch (error) {
      console.error('获取文章评论树失败:', error);
      return ResultDto.fail('获取文章评论树失败: ' + error.message);
    }
  }

  /**
   * 获取评论树
   */
  @Get('tree/:articleId')
  @ApiOperation({ summary: '查询评论树' })
  async findTree(@Param('articleId') articleId: string): Promise<ResultDto<any[]>> {
    try {
      console.log(`获取评论树, 文章ID: ${articleId}`);
      const comments = await this.commentService.findTree(+articleId);

      // 转换为前端期望的格式
      const formattedComments = comments.map((comment) => {
        // 子评论列表将通过另一个API获取
        return {
          id: comment.id,
          fromNickname: comment.user?.nickname || comment.user?.username || '匿名用户',
          fromUid: comment.userId,
          avatar: comment.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
          commentContent: comment.content,
          createTime: comment.createTime,
          likeCount: 0, // 默认点赞数量为0
          replyCount: 0, // 将通过单独查询获取
          replyVOList: [], // 初始为空，会由前端按需加载
        };
      });

      console.log(`格式化后的评论树结果: ${formattedComments.length}条评论`);
      return ResultDto.success(formattedComments);
    } catch (error) {
      console.error('获取评论树失败:', error);
      return ResultDto.fail('获取评论树失败: ' + error.message);
    }
  }

  /**
   * 获取评论详情
   */
  @Get(':id')
  @ApiOperation({ summary: '查询评论详情' })
  async findById(@Param('id') id: string): Promise<ResultDto<Comment>> {
    const result = await this.commentService.findById(+id);
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
}
