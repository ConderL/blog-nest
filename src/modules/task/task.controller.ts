import {
  Controller,
  Post,
  Get,
  UseGuards,
  Query,
  Param,
  Delete,
  Body,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Result } from '../../common/utils/result';
import { LogService } from '../log/log.service';
// 暂时注释掉权限相关导入
// import { Permissions } from '../../common/decorators/permissions.decorator';
// import { PermissionGuard } from '../../common/guards/permission.guard';

@ApiTags('任务管理')
@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@ApiBearerAuth()
export class TaskController {
  private readonly logger = new Logger(TaskController.name);

  constructor(
    private readonly taskService: TaskService,
    private readonly logService: LogService,
  ) {}

  @Post('backup')
  @ApiOperation({ summary: '手动触发数据备份' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // 暂时注释掉权限检查
  // @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions('system:backup:trigger')
  async triggerBackup() {
    const backupPath = await this.taskService.manualBackup();
    return { message: '备份任务已成功执行', backupPath };
  }

  @Get('backup/list')
  @ApiOperation({ summary: '获取备份文件列表' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // 暂时注释掉权限检查
  // @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions('system:backup:list')
  async getBackupList(): Promise<any[]> {
    return this.taskService.getBackupList();
  }

  @Delete('backup/:filename')
  @ApiOperation({ summary: '删除指定备份文件' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  // 暂时注释掉权限检查
  // @UseGuards(JwtAuthGuard, PermissionGuard)
  // @Permissions('system:backup:delete')
  async deleteBackup(
    @Param('filename') filename: string,
  ): Promise<{ success: boolean; message: string }> {
    const result = await this.taskService.deleteBackup(filename);
    return {
      success: result,
      message: result ? '备份文件删除成功' : '备份文件删除失败',
    };
  }

  @Get('stats/summary')
  @ApiOperation({ summary: '获取统计数据摘要' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getStatsSummary() {
    try {
      const data = await this.taskService.getStatsSummary();
      return Result.ok(data);
    } catch (error) {
      this.logger.error(`获取统计摘要失败: ${error.message}`);
      return Result.fail('获取统计摘要失败');
    }
  }

  @Get('stats/content')
  @ApiOperation({ summary: '获取内容统计数据' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getContentStats() {
    return await this.taskService.getContentStats();
  }

  @Get('stats/visits')
  @ApiOperation({ summary: '获取访问统计数据' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiQuery({
    name: 'period',
    required: false,
    description: '统计周期，可选值：day, week, month，默认为week',
  })
  async getVisitStats(@Query('period') period?: string) {
    return await this.taskService.getVisitStats(period);
  }

  @ApiOperation({ summary: '手动执行任务' })
  @Post('run')
  async runTask(@Body() data: { taskName: string; taskGroup?: string; invokeTarget: string }) {
    try {
      const { taskName, taskGroup = 'MANUAL', invokeTarget } = data;

      // 记录任务开始日志
      await this.logService.recordTaskLog({
        taskName,
        taskGroup,
        invokeTarget,
        taskMessage: `手动执行任务: ${taskName}`,
        status: 1,
      });

      this.logger.log(`手动执行任务: ${taskName}, ${invokeTarget}`);

      // 根据invokeTarget执行特定的任务
      let result;
      switch (invokeTarget) {
        case 'taskService.manualBackup':
          result = await this.taskService.manualBackup();
          break;
        case 'taskService.handleDataCleanup':
          await this.taskService.handleDataCleanup();
          result = '数据清理完成';
          break;
        case 'taskService.handleHourlyVisitStats':
          await this.taskService.handleHourlyVisitStats();
          result = '访问统计完成';
          break;
        default:
          throw new Error(`未知的任务目标: ${invokeTarget}`);
      }

      return Result.ok(result, '任务执行成功');
    } catch (error) {
      // 记录失败日志
      if (data) {
        await this.logService.recordTaskLog({
          taskName: data.taskName,
          taskGroup: data.taskGroup || 'MANUAL',
          invokeTarget: data.invokeTarget,
          taskMessage: `手动执行任务失败: ${data.taskName}`,
          status: 0,
          errorInfo: error.message,
        });
      }

      this.logger.error(`执行任务失败: ${error.message}`);
      return Result.fail(`执行任务失败: ${error.message}`);
    }
  }
}
