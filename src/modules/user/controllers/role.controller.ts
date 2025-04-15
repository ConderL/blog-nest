import { Controller, Get, Post, Body, Put, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RoleService } from '../services/role.service';
import { Role } from '../entities/role.entity';

@ApiTags('角色管理')
@Controller('roles')
@UseGuards(JwtAuthGuard)
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @ApiOperation({ summary: '创建角色' })
  async create(@Body() role: Partial<Role>): Promise<Role> {
    return this.roleService.create(role);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新角色' })
  async update(@Param('id') id: number, @Body() role: Partial<Role>): Promise<Role> {
    return this.roleService.update(id, role);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除角色' })
  async remove(@Param('id') id: number): Promise<void> {
    return this.roleService.remove(id);
  }

  @Get()
  @ApiOperation({ summary: '获取所有角色' })
  async findAll(): Promise<Role[]> {
    return this.roleService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取角色详情' })
  async findOne(@Param('id') id: number): Promise<Role> {
    return this.roleService.findById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: '获取用户角色' })
  async findByUserId(@Param('userId') userId: number): Promise<Role[]> {
    return this.roleService.findByUserId(userId);
  }

  @Post(':roleId/menus')
  @ApiOperation({ summary: '分配角色菜单权限' })
  async assignMenus(@Param('roleId') roleId: number, @Body() menuIds: number[]): Promise<void> {
    return this.roleService.assignMenus(roleId, menuIds);
  }

  @Post('user/:userId')
  @ApiOperation({ summary: '为用户分配角色' })
  async assignUserRoles(@Param('userId') userId: number, @Body() roleIds: number[]): Promise<void> {
    return this.roleService.assignUserRoles(userId, roleIds);
  }
}
