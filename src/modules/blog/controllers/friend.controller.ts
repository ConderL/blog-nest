import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { FriendService } from '../services/friend.service';
import { Friend } from '../entities/friend.entity';

@ApiTags('友链管理')
@Controller('friends')
export class FriendController {
  constructor(private readonly friendService: FriendService) {}

  @Post()
  @ApiOperation({ summary: '创建友链' })
  @UseGuards(JwtAuthGuard)
  async create(@Body() friend: Partial<Friend>): Promise<Friend> {
    return this.friendService.create(friend);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新友链' })
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: number, @Body() friend: Partial<Friend>): Promise<Friend> {
    return this.friendService.update(id, friend);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除友链' })
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: number): Promise<void> {
    return this.friendService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取友链列表' })
  @ApiQuery({ name: 'status', required: false })
  async findAll(@Query('status') status?: number): Promise<Friend[]> {
    return this.friendService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取友链详情' })
  async findOne(@Param('id') id: number): Promise<Friend> {
    return this.friendService.findById(id);
  }
}
