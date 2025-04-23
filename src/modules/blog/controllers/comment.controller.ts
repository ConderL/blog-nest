import { Controller, Get, Post, Body, Patch, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResultDto } from '../../../common/dtos/result.dto';
import { Comment } from '../entities/comment.entity';
import { OperationLog } from '../../../common/decorators/operation-log.decorator';
import { OperationType } from '../../../common/enums/operation-type.enum';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('评论管理')
@Controller('comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

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

      // 前端API默认只显示已审核的评论
      const showAll = false;

      console.log(
        `获取评论列表: page=${page}, limit=${limit}, typeId=${typeId}, commentType=${commentType}, showAll=${showAll}`,
      );

      // 调用服务获取评论列表
      const [comments, count] = await this.commentService.findAll(
        page,
        limit,
        typeId,
        commentType,
        showAll,
      );

      // 格式化主评论
      const formattedComments = [];

      // 处理每条评论，获取其回复列表
      for (const comment of comments) {
        // 查询该评论的回复列表（限制3条）
        const replies = await this.commentService.getReplies(comment.id, 1, 3, showAll);
        const replyCount = await this.commentService.getReplyCount(comment.id);

        // 格式化回复列表
        const replyVOList = [];

        // 为每条回复获取被回复用户的昵称
        for (const reply of replies) {
          let toNickname = '';

          // 如果有指定回复用户ID，查找被回复用户
          if (reply.toUid) {
            try {
              const toUser = await this.commentService.findById(reply.toUid);
              if (toUser) {
                toNickname = toUser.user?.nickname || toUser.user?.username || '未知用户';
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
  @Public()
  async getRecentComments(): Promise<ResultDto<any>> {
    try {
      console.log('接收到获取最新评论请求');
      // 只获取已审核的最新评论
      const recentComments = await this.commentService.getRecentComments(5);

      if (!recentComments || recentComments.length === 0) {
        return ResultDto.success([], '暂无评论');
      }

      // 只返回已审核的评论
      const filteredComments = recentComments.filter((comment) => comment.isCheck === 1);

      // 格式化评论数据
      const formattedComments = filteredComments.map((comment) => {
        // 处理用户信息
        const nickname = comment.user?.nickname || comment.user?.username || '匿名用户';
        const avatar = comment.user?.avatar || '';

        // 根据评论类型获取不同的标题
        let articleTitle = '未知内容';
        if (comment.commentType === 1 && comment.article) {
          // 文章评论
          articleTitle = comment.article.articleTitle || '未知文章';
        } else if (comment.commentType === 2) {
          // 友链评论
          articleTitle = '友情链接';
        } else if (comment.commentType === 3) {
          // 说说评论
          articleTitle = '说说';
        } else if (comment.commentType === 4) {
          // 留言评论
          articleTitle = '留言板';
        }

        return {
          id: comment.id,
          commentContent: comment.content,
          createTime: comment.createTime,
          fromUid: comment.userId,
          typeId: comment.typeId,
          commentType: comment.commentType,
          nickname,
          avatar,
          articleTitle,
        };
      });

      console.log(`成功获取最新评论，共${formattedComments.length}条`);
      return ResultDto.success(formattedComments);
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

      // 默认只显示已审核的评论
      const showAll = false;

      const comments = await this.commentService.findByArticleId(articleId, showAll);

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

      // 根据评论服务实现，在findTree方法中添加过滤未审核评论的功能
      // 因为我们已经修改了CommentService，所有查询默认都会过滤未审核的评论
      const comments = await this.commentService.findTree(+articleId);

      // 进一步过滤未审核的评论
      const approvedComments = comments.filter((comment) => comment.isCheck === 1);

      // 转换为前端期望的格式
      const formattedComments = approvedComments.map((comment) => {
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
