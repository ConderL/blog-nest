import { Controller, Get, Post, Delete, Body, Query, Param, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { MessageService } from '../services/message.service';
import { Result } from '../../../common/result';
import { Auth } from '../../../decorators/auth.decorator';

/**
 * 管理端留言控制器
 * 用于管理员管理留言
 */
@ApiTags('管理端留言管理')
@Controller('admin/message')
@Auth()
export class AdminMessageController {
  private logger = new Logger(AdminMessageController.name);

  constructor(private readonly messageService: MessageService) {}

  /**
   * 获取留言列表（后台）
   * 支持按昵称和审核状态筛选
   */
  @ApiOperation({
    summary: '获取留言列表',
    description: '获取所有留言列表，支持按昵称和审核状态筛选',
  })
  @ApiQuery({ name: 'current', required: false, description: '当前页码，默认为1' })
  @ApiQuery({ name: 'size', required: false, description: '每页数量，默认为10' })
  @ApiQuery({ name: 'nickname', required: false, description: '昵称' })
  @ApiQuery({ name: 'isCheck', required: false, description: '审核状态（0-未通过，1-已通过）' })
  @ApiResponse({
    status: 200,
    description: '返回留言列表及分页信息',
    schema: {
      example: {
        code: 200,
        message: '操作成功',
        data: {
          recordList: [
            {
              id: 1,
              nickname: '用户昵称',
              avatar: '头像URL',
              messageContent: '留言内容',
              ipAddress: 'IP地址',
              ipSource: 'IP来源',
              isCheck: 1,
              createTime: '2023-01-01 00:00:00',
              updateTime: '2023-01-01 00:00:00',
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
    @Query('nickname') nickname?: string,
    @Query('isCheck') isCheck?: number,
  ) {
    try {
      this.logger.log(
        `获取留言列表: current=${current}, size=${size}, nickname=${nickname}, isCheck=${isCheck}`,
      );

      // 转换参数类型
      const params = {
        current: +current,
        size: +size,
        nickname,
        isCheck:
          isCheck !== undefined ? (Number.isNaN(+isCheck) ? undefined : +isCheck) : undefined,
      };

      const { records, count, total } = await this.messageService.findAll(
        params.current,
        params.size,
        params.nickname,
        params.isCheck,
      );

      return Result.ok({
        recordList: records,
        count,
        total,
        current: params.current,
        size: params.size,
      });
    } catch (error) {
      this.logger.error(`获取留言列表失败: ${error.message}`);
      return Result.fail('获取留言列表失败');
    }
  }

  /**
   * 删除留言
   */
  @ApiOperation({ summary: '删除留言', description: '根据ID删除留言' })
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
  async remove(@Body() messageIdList: number[]) {
    try {
      this.logger.log(`删除留言: id=${messageIdList}`);
      await this.messageService.remove(messageIdList);
      return Result.ok(null, '删除成功');
    } catch (error) {
      this.logger.error(`删除留言失败: ${error.message}`);
      return Result.fail('删除留言失败');
    }
  }

  /**
   * 审核留言
   */
  @ApiOperation({ summary: '审核留言', description: '更新留言的审核状态' })
  @ApiResponse({
    status: 200,
    description: '审核成功',
    schema: {
      example: {
        code: 200,
        message: '审核成功',
        data: null,
      },
    },
  })
  @Post('review')
  async review(@Body() body: { id: number; isCheck: number }) {
    try {
      this.logger.log(`审核留言: id=${body.id}, isCheck=${body.isCheck}`);
      await this.messageService.updateStatus(body.id, body.isCheck);
      return Result.ok(null, '审核成功');
    } catch (error) {
      this.logger.error(`审核留言失败: ${error.message}`);
      return Result.fail('审核留言失败');
    }
  }
}
