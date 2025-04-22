import { Controller, Get, Post, Delete, Body, Query, Logger, Req, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiParam } from '@nestjs/swagger';
import { TalkService } from '../services/talk.service';
import { Result } from '../../../common/result';
import { Auth } from '../../../decorators/auth.decorator';
import { Public } from '../../../common/decorators/public.decorator';
import { CommentService } from '../services/comment.service';
import { CommentType } from '../entities/comment.entity';

/**
 * 管理端说说控制器
 * 用于管理员管理说说
 */
@ApiTags('管理端说说管理')
@Controller('admin/talk')
@Auth()
export class AdminTalkController {
  private logger = new Logger(AdminTalkController.name);

  constructor(private readonly talkService: TalkService) {}

  /**
   * 获取说说列表（后台）
   * 支持按内容关键词和状态筛选
   */
  @ApiOperation({
    summary: '获取说说列表',
    description: '获取所有说说列表，支持按内容关键词和状态筛选',
  })
  @ApiQuery({ name: 'current', required: false, description: '当前页码，默认为1' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量，默认为10' })
  @ApiQuery({ name: 'keyword', required: false, description: '关键词' })
  @ApiQuery({ name: 'status', required: false, description: '状态（1-公开，2-私密）' })
  @ApiResponse({
    status: 200,
    description: '返回说说列表及分页信息',
    schema: {
      example: {
        code: 200,
        message: '操作成功',
        data: {
          recordList: [
            {
              id: 1,
              userId: 1,
              talkContent: '说说内容',
              images: '图片URL',
              isTop: 0,
              status: 1,
              createTime: '2023-01-01 00:00:00',
              updateTime: '2023-01-01 00:00:00',
              user: {
                id: 1,
                username: '用户名',
                nickname: '用户昵称',
                avatar: '头像URL',
              },
            },
          ],
          count: 1,
          total: 10,
          current: 1,
          size: 10,
        },
      },
    },
  })
  @Get('list')
  async findAll(
    @Query('current') current = 1,
    @Query('size') size = 10,
    @Query('keyword') keyword?: string,
    @Query('status') status?: number,
  ) {
    try {
      this.logger.log(
        `获取说说列表: current=${current}, size=${size}, keyword=${keyword}, status=${status}`,
      );

      // 转换参数类型
      const params = {
        current: +current,
        size: +size,
        keyword,
        status: status !== undefined ? (Number.isNaN(+status) ? undefined : +status) : undefined,
      };

      const { records, count } = await this.talkService.findAll(
        params.current,
        params.size,
        params.keyword,
        params.status,
      );

      return Result.ok({
        recordList: records,
        count: records.length,
        total: count,
        current: params.current,
        size: params.size,
      });
    } catch (error) {
      this.logger.error(`获取说说列表失败: ${error.message}`);
      return Result.fail('获取说说列表失败');
    }
  }

  /**
   * 发布说说
   */
  @ApiOperation({ summary: '发布说说', description: '创建一条新的说说' })
  @ApiResponse({
    status: 200,
    description: '发布成功',
    schema: {
      example: {
        code: 200,
        message: '发布成功',
        data: {
          id: 1,
          userId: 1,
          talkContent: '说说内容',
          images: '图片URL',
          isTop: 0,
          status: 1,
          createTime: '2023-01-01 00:00:00',
          updateTime: '2023-01-01 00:00:00',
        },
      },
    },
  })
  @Post('add')
  async create(@Body() talkData: any, @Req() req: any) {
    try {
      this.logger.log(`发布说说: ${JSON.stringify(talkData)}`);

      // 获取当前登录用户ID
      const userId = req.user?.id || req.user?.userId || req.user?.sub;

      if (!userId) {
        return Result.fail('无法获取用户ID，请重新登录');
      }

      // 创建说说数据对象
      const talk = {
        userId,
        talkContent: talkData.talkContent,
        images: talkData.images || '',
        isTop: talkData.isTop || 0,
        status: talkData.status || 1,
      };

      const result = await this.talkService.create(talk);

      return Result.ok(result, '发布成功');
    } catch (error) {
      this.logger.error(`发布说说失败: ${error.message}`);
      return Result.fail('发布说说失败');
    }
  }

  /**
   * 删除说说
   */
  @ApiOperation({ summary: '删除说说', description: '根据ID删除说说' })
  @ApiResponse({
    status: 200,
    description: '删除成功',
    schema: {
      example: {
        code: 200,
        message: '删除成功',
        data: null,
      },
    },
  })
  @Delete('delete')
  async remove(@Body() talkIdList: number[]) {
    try {
      this.logger.log(`删除说说: id=${talkIdList.join(',')}`);
      await this.talkService.remove(talkIdList);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`删除说说失败: ${error.message}`);
      return Result.fail('删除说说失败');
    }
  }

  /**
   * 更新说说置顶状态
   */
  @ApiOperation({ summary: '更新说说置顶状态', description: '更新说说的置顶状态' })
  @ApiResponse({
    status: 200,
    description: '更新成功',
    schema: {
      example: {
        code: 200,
        message: '更新成功',
        data: null,
      },
    },
  })
  @Post('top')
  async updateTopStatus(@Body() body: { id: number; isTop: number }) {
    try {
      this.logger.log(`更新说说置顶状态: id=${body.id}, isTop=${body.isTop}`);
      await this.talkService.updateTopStatus(body.id, body.isTop);
      return Result.ok(null, '更新成功');
    } catch (error) {
      this.logger.error(`更新说说置顶状态失败: ${error.message}`);
      return Result.fail('更新说说置顶状态失败');
    }
  }
}

@ApiTags('博客端说说管理')
@Controller('talk')
@Public()
export class TalkController {
  private logger = new Logger(TalkController.name);

  constructor(
    private readonly talkService: TalkService,
    private readonly commentService: CommentService,
  ) {}

  /**
   * 获取主页简化说说列表
   */
  @ApiOperation({
    summary: '获取主页说说列表',
    description: '获取简化的说说列表，只返回内容',
  })
  @ApiQuery({ name: 'limit', required: false, description: '返回数量，默认为3' })
  @Get('home')
  async getHomeList(@Query('limit') limit = 3) {
    try {
      this.logger.log(`获取主页说说列表: limit=${limit}`);

      // 转换参数类型
      const params = {
        current: 1,
        size: +limit,
        status: 1, // 只获取公开的说说
      };

      const { records } = await this.talkService.findAll(
        params.current,
        params.size,
        undefined, // 不需要关键词过滤
        params.status,
      );

      // 只提取说说内容
      const talkContents = records.map((talk) => talk.talkContent);

      return {
        flag: true,
        code: 200,
        msg: '操作成功',
        data: talkContents,
      };
    } catch (error) {
      this.logger.error(`获取主页说说列表失败: ${error.message}`);
      return {
        flag: false,
        code: 500,
        msg: '获取说说列表失败',
        data: null,
      };
    }
  }

  /**
   * 获取说说列表（前台）
   */
  @ApiOperation({
    summary: '获取说说列表',
    description: '获取所有公开的说说列表',
  })
  @ApiQuery({ name: 'current', required: false, description: '当前页码，默认为1' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量，默认为10' })
  @Get('list')
  async findAll(@Query('current') current = 1, @Query('size') size = 10) {
    try {
      this.logger.log(`获取前台说说列表: current=${current}, size=${size}`);

      // 转换参数类型
      const params = {
        current: +current,
        size: +size,
        status: 1, // 只获取公开的说说
      };

      const { records, count } = await this.talkService.findAll(
        params.current,
        params.size,
        undefined, // 不需要关键词过滤
        params.status,
      );

      // 格式化数据为前端需要的格式并获取评论数量
      const recordListPromises = records.map(async (talk) => {
        // 获取说说的评论数量，commentType=3代表说说评论
        const commentCount = await this.commentService.countCommentsByTypeAndId(
          talk.id,
          CommentType.TALK,
        );

        return {
          id: talk.id,
          nickname: talk.user?.nickname || talk.user?.username || '匿名用户',
          avatar: talk.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
          talkContent: talk.talkContent,
          imgList: talk.images ? talk.images.split(',').filter((img) => img) : [],
          isTop: talk.isTop,
          likeCount: 0, // 目前暂无点赞功能，默认为0
          commentCount, // 设置实际的评论数量
          createTime: talk.createTime,
        };
      });

      const recordList = await Promise.all(recordListPromises);

      return {
        flag: true,
        code: 200,
        msg: '操作成功',
        data: {
          recordList,
          count,
        },
      };
    } catch (error) {
      this.logger.error(`获取前台说说列表失败: ${error.message}`);
      return {
        flag: false,
        code: 500,
        msg: '获取说说列表失败',
        data: null,
      };
    }
  }

  /**
   * 获取说说详情
   */
  @ApiOperation({ summary: '获取说说详情', description: '根据ID获取说说详情' })
  @ApiParam({ name: 'id', description: '说说ID' })
  @Get(':id')
  async findById(@Param('id') id: string) {
    try {
      this.logger.log(`获取说说详情: id=${id}`);

      const talk = await this.talkService.findById(+id);

      if (!talk) {
        return {
          flag: false,
          code: 404,
          msg: '说说不存在',
          data: null,
        };
      }

      // 只允许查看公开的说说
      if (talk.status !== 1) {
        return {
          flag: false,
          code: 403,
          msg: '说说不可见',
          data: null,
        };
      }

      // 获取说说的评论数量，commentType=3代表说说评论
      const commentCount = await this.commentService.countCommentsByTypeAndId(
        talk.id,
        CommentType.TALK,
      );

      // 格式化数据为前端需要的格式
      const formattedTalk = {
        id: talk.id,
        nickname: talk.user?.nickname || talk.user?.username || '匿名用户',
        avatar: talk.user?.avatar || 'http://img.conder.top/config/default_avatar.jpg',
        talkContent: talk.talkContent,
        imgList: talk.images ? talk.images.split(',').filter((img) => img) : [],
        isTop: talk.isTop,
        likeCount: 0, // 目前暂无点赞功能，默认为0
        commentCount, // 设置实际的评论数量
        createTime: talk.createTime,
      };

      return {
        flag: true,
        code: 200,
        msg: '操作成功',
        data: formattedTalk,
      };
    } catch (error) {
      this.logger.error(`获取说说详情失败: ${error.message}`);
      return {
        flag: false,
        code: 500,
        msg: '获取说说详情失败',
        data: null,
      };
    }
  }
}
