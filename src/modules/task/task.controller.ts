import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { TaskService } from './task.service';
import { Permissions } from '../../common/decorators/permissions.decorator';

@ApiTags('定时任务')
@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post('backup')
  @ApiOperation({ summary: '手动触发数据库备份' })
  @Permissions('task:backup')
  async manualBackup(): Promise<{ path: string }> {
    const path = await this.taskService.manualBackup();
    return { path };
  }

  @Get('stats')
  @ApiOperation({ summary: '获取统计摘要' })
  async getStatsSummary(): Promise<any> {
    return this.taskService.getStatsSummary();
  }
}
