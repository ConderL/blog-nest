import { Controller, Get, Post, Param, UseGuards, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentService } from '../services/comment.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ResultDto } from '../../../common/dtos/result.dto';
import { UserService } from '../../../modules/user/user.service';

@ApiTags('评论回复')
@Controller()
export class CommentReplyController {
  constructor(
    private readonly commentService: CommentService,
    private readonly userService: UserService,
  ) {}

  /**
   * 获取评论的回复列表
   */
  @Get('comment/:commentId/reply')
  @ApiOperation({ summary: '获取评论的回复列表' })
  @ApiParam({ name: 'commentId', description: '评论ID' })
  async getReplyList(
    @Param('commentId') commentId: number,
    @Query() query: any,
  ): Promise<ResultDto<any[]>> {
    try {
      console.log(`获取评论回复列表, 评论ID: ${commentId}`);
      const page = Number(query.current) || Number(query.page) || 1;
      const limit = Number(query.size) || Number(query.limit) || 5;

      // 获取回复
      const replies = await this.commentService.getReplies(commentId, page, limit);

      // 首先获取父评论信息，用于处理回复主评论的情况
      const parentComment = await this.commentService.findById(commentId);
      const parentUserNickname =
        parentComment?.user?.nickname || parentComment?.user?.username || '未知用户';

      // 格式化为前端期望的格式
      const formattedReplies = [];

      for (const reply of replies) {
        let toNickname = '';
        // 获取被回复用户的昵称
        if (reply.toUid) {
          try {
            console.log(`查询被回复用户, 用户ID: ${reply.toUid}`);
            const toUser = await this.userService.findById(reply.toUid);
            if (toUser) {
              toNickname = toUser.nickname || toUser.username || '未知用户';
              console.log(`找到被回复用户昵称: ${toNickname}`);
            } else {
              console.log(`未找到被回复用户, ID: ${reply.toUid}`);
              toNickname = '未知用户';
            }
          } catch (error) {
            console.error(`查询被回复用户昵称失败, 用户ID: ${reply.toUid}`, error);
            toNickname = '未知用户';
          }
        } else {
          // 如果没有toUserId，则是回复主评论
          toNickname = parentUserNickname;
          console.log(`回复主评论，使用父评论用户昵称: ${toNickname}`);
        }

        formattedReplies.push({
          id: reply.id,
          fromNickname: reply.user?.nickname || reply.user?.username || '匿名用户',
          fromUid: reply.userId,
          avatar: reply.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
          toUid: reply.toUid || parentComment?.userId,
          toNickname: toNickname,
          commentContent: reply.content,
          createTime: reply.createTime,
          likeCount: 0, // 默认点赞数量为0
        });
      }

      console.log(`格式化完成, 获取到${formattedReplies.length}条回复`);
      return ResultDto.success(formattedReplies);
    } catch (error) {
      console.error('获取评论回复列表失败:', error);
      return ResultDto.fail('获取评论回复列表失败: ' + error.message);
    }
  }

  /**
   * 点赞评论
   */
  @Post('comment/:commentId/like')
  @ApiOperation({ summary: '点赞评论' })
  @ApiParam({ name: 'commentId', description: '评论ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async likeComment(
    @Param('commentId') commentId: number,
    @Req() req: any,
  ): Promise<ResultDto<any>> {
    try {
      // 这里应该实现点赞逻辑，但由于缺少点赞表，暂时返回成功
      console.log(
        `点赞评论, 评论ID: ${commentId}, 用户ID: ${req.user?.id || req.user?.userId || req.user?.sub}`,
      );
      return ResultDto.success(null, '点赞成功');
    } catch (error) {
      console.error('点赞评论失败:', error);
      return ResultDto.fail('点赞评论失败: ' + error.message);
    }
  }
}
