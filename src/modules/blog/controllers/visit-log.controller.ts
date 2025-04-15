import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { VisitLogService } from '../services/visit-log.service';
import { VisitLog } from '../entities/visit-log.entity';

@ApiTags('访问统计')
@Controller('visit-logs')
export class VisitLogController {
  constructor(private readonly visitLogService: VisitLogService) {}

  @Post()
  @ApiOperation({ summary: '记录访问日志' })
  async create(@Body() visitLog: Partial<VisitLog>): Promise<VisitLog> {
    return this.visitLogService.create(visitLog);
  }

  @Get()
  @ApiOperation({ summary: '获取访问日志列表' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @UseGuards(JwtAuthGuard)
  async findAll(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ): Promise<{ items: VisitLog[]; total: number }> {
    return this.visitLogService.findAll(page, limit);
  }

  @Get('today')
  @ApiOperation({ summary: '获取今日访问量' })
  async getTodayVisits(): Promise<number> {
    return this.visitLogService.getTodayVisits();
  }

  @Get('total')
  @ApiOperation({ summary: '获取总访问量' })
  async getTotalVisits(): Promise<number> {
    return this.visitLogService.getTotalVisits();
  }

  @Get('weekly')
  @ApiOperation({ summary: '获取近7天的访问统计' })
  async getWeeklyVisits(): Promise<{ date: string; count: number }[]> {
    return this.visitLogService.getWeeklyVisits();
  }
}
