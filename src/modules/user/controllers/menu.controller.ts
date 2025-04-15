import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { MenuService } from '../services/menu.service';
import { Menu } from '../entities/menu.entity';

@ApiTags('菜单管理')
@Controller('menus')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  @Post()
  @ApiOperation({ summary: '创建菜单' })
  async create(@Body() menu: Partial<Menu>): Promise<Menu> {
    return this.menuService.create(menu);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新菜单' })
  async update(@Param('id') id: number, @Body() menu: Partial<Menu>): Promise<Menu> {
    return this.menuService.update(id, menu);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除菜单' })
  async remove(@Param('id') id: number): Promise<void> {
    return this.menuService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有菜单' })
  async findAll(): Promise<Menu[]> {
    return this.menuService.findAll();
  }

  @Get('tree')
  @ApiOperation({ summary: '获取菜单树' })
  async findTree(): Promise<Menu[]> {
    return this.menuService.findTree();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取菜单详情' })
  async findOne(@Param('id') id: number): Promise<Menu> {
    return this.menuService.findById(id);
  }

  @Post('role-menus')
  @ApiOperation({ summary: '获取角色菜单树' })
  async findTreeByRoleIds(@Body() roleIds: number[]): Promise<Menu[]> {
    return this.menuService.findTreeByRoleIds(roleIds);
  }
}
