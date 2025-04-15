import { Controller, Post, Get, UseGuards, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskService } from './task.service';
// 暂时注释掉权限相关导入
// import { Permissions } from '../../common/decorators/permissions.decorator';
// import { PermissionGuard } from '../../common/guards/permission.guard';

@ApiTags('任务管理')
@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

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
    return await this.taskService.getStatsSummary();
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
}
