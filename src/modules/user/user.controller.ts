import { Controller, Get, Post, Body, Put, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from './user.service';
import { MenuService } from './services/menu.service';
import { User } from './entities/user.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { ResultDto } from '../../common/dtos/result.dto';

@ApiTags('用户管理')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly menuService: MenuService,
  ) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getProfile(@Request() req) {
    return this.userService.findById(req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async update(@Param('id') id: number, @Body() user: Partial<User>) {
    return this.userService.update(id, user);
  }

  @Post('register')
  @ApiOperation({ summary: '用户注册' })
  @Public()
  async register(@Body() createUserDto: Partial<User>): Promise<User> {
    return this.userService.create(createUserDto);
  }

  @Get('getUserInfo')
  @ApiOperation({ summary: '获取当前登录用户信息' })
  @ApiBearerAuth()
  async getUserInfo(@Request() req): Promise<ResultDto<any>> {
    try {
      const userId = req.user.id;
      console.log('获取用户信息，用户ID:', userId);

      // 获取用户基本信息
      const user = await this.userService.findById(userId);
      if (!user) {
        console.error('用户不存在，ID:', userId);
        return ResultDto.fail('用户不存在');
      }

      // 获取用户角色
      const roleList = await this.userService.getUserRoles(userId);
      console.log('获取到角色:', roleList);

      // 获取用户权限
      const permissionList = await this.userService.getUserPermissions(userId);
      console.log('获取到权限数量:', permissionList.length);

      const userInfo = {
        id: user.id,
        username: user.username,
        nickname: user.nickname || user.username,
        avatar: user.avatar || '',
        email: user.email || '',
        roleList: roleList.map((role) => role.roleLabel),
        permissionList,
      };

      console.log('返回用户信息:', JSON.stringify(userInfo).substring(0, 100) + '...');
      return ResultDto.success(userInfo);
    } catch (error) {
      console.error('获取用户信息失败:', error);
      return ResultDto.fail('获取用户信息失败');
    }
  }

  @Get('getUserMenu')
  @ApiOperation({ summary: '获取当前登录用户菜单' })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getUserMenu(@Request() req): Promise<ResultDto<any>> {
    const userId = req.user.id;
    // 获取用户角色
    const roles = await this.userService.getUserRoles(userId);
    const roleIds = roles.map((role) => role.id);

    console.log('getUserMenu - 用户ID:', userId);
    console.log('getUserMenu - 用户角色IDs:', roleIds);

    // 超级管理员返回所有菜单
    if (roleIds.includes(1)) {
      console.log('getUserMenu - 超级管理员，返回所有菜单');
      const allMenus = await this.menuService.findTree();
      console.log('getUserMenu - 查询到菜单数量:', allMenus.length);
      console.log('getUserMenu - 菜单数据:', JSON.stringify(allMenus));

      const formattedMenus = this.formatMenusForFrontend(allMenus);
      console.log('getUserMenu - 格式化后菜单数量:', formattedMenus.length);
      console.log('getUserMenu - 格式化后菜单:', JSON.stringify(formattedMenus));

      return ResultDto.success(formattedMenus);
    }

    // 普通用户返回角色拥有的菜单
    console.log('getUserMenu - 普通用户，返回角色拥有的菜单');
    const menus = await this.menuService.findTreeByRoleIds(roleIds);
    console.log('getUserMenu - 查询到菜单数量:', menus.length);

    const formattedMenus = this.formatMenusForFrontend(menus);
    console.log('getUserMenu - 格式化后菜单数量:', formattedMenus.length);

    return ResultDto.success(formattedMenus);
  }

  /**
   * 格式化菜单为前端需要的格式
   */
  private formatMenusForFrontend(menus: any[]): any[] {
    return menus.map((menu) => {
      const formattedMenu: any = {
        path: menu.path,
        component: menu.component,
        meta: {
          title: menu.name,
          icon: menu.icon,
          hidden: menu.hidden,
        },
      };

      // 如果有子菜单，递归处理
      if (menu.children && menu.children.length > 0) {
        formattedMenu.children = this.formatMenusForFrontend(menu.children);
      }

      return formattedMenu;
    });
  }
}

@ApiTags('后台用户管理')
@Controller('admin/user')
@UseGuards(JwtAuthGuard)
export class AdminUserController {
  constructor(
    private readonly userService: UserService,
    private readonly menuService: MenuService,
  ) {}

  @Get('getUserInfo')
  @ApiOperation({ summary: '获取当前登录用户信息' })
  @ApiBearerAuth()
  async getUserInfo(@Request() req): Promise<ResultDto<any>> {
    const userId = req.user.id;
    // 获取用户基本信息
    const user = await this.userService.findById(userId);
    // 获取用户角色
    const roleList = await this.userService.getUserRoles(userId);
    // 获取用户权限
    const permissionList = await this.userService.getUserPermissions(userId);

    const userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || '',
      roleList: roleList.map((role) => role.roleLabel),
      permissionList,
    };

    return ResultDto.success(userInfo);
  }

  @Get('getUserMenu')
  @ApiOperation({ summary: '获取当前登录用户菜单' })
  @ApiBearerAuth()
  async getUserMenu(@Request() req): Promise<ResultDto<any>> {
    const userId = req.user.id;
    // 获取用户角色
    const roles = await this.userService.getUserRoles(userId);
    const roleIds = roles.map((role) => role.id);

    console.log('AdminUserController.getUserMenu - 用户ID:', userId);
    console.log('AdminUserController.getUserMenu - 用户角色IDs:', roleIds);

    // 超级管理员返回所有菜单
    if (roleIds.includes(1)) {
      console.log('AdminUserController.getUserMenu - 超级管理员，返回所有菜单');
      const allMenus = await this.menuService.findTree();
      console.log('AdminUserController.getUserMenu - 查询到菜单数量:', allMenus.length);
      console.log('AdminUserController.getUserMenu - 菜单数据:', JSON.stringify(allMenus));

      const formattedMenus = this.formatMenusForFrontend(allMenus);
      console.log('AdminUserController.getUserMenu - 格式化后菜单数量:', formattedMenus.length);
      console.log(
        'AdminUserController.getUserMenu - 格式化后菜单数据:',
        JSON.stringify(formattedMenus),
      );

      return ResultDto.success(formattedMenus);
    }

    // 普通用户返回角色拥有的菜单
    console.log('AdminUserController.getUserMenu - 普通用户，返回角色拥有的菜单');
    const menus = await this.menuService.findTreeByRoleIds(roleIds);
    console.log('AdminUserController.getUserMenu - 查询到菜单数量:', menus.length);

    const formattedMenus = this.formatMenusForFrontend(menus);
    console.log('AdminUserController.getUserMenu - 格式化后菜单数量:', formattedMenus.length);

    return ResultDto.success(formattedMenus);
  }

  /**
   * 格式化菜单为前端需要的格式
   */
  private formatMenusForFrontend(menus: any[]): any[] {
    return menus.map((menu) => {
      const formattedMenu: any = {
        path: menu.path,
        component: menu.component,
        meta: {
          title: menu.name,
          icon: menu.icon,
          hidden: menu.hidden,
        },
      };

      // 如果有子菜单，递归处理
      if (menu.children && menu.children.length > 0) {
        formattedMenu.children = this.formatMenusForFrontend(menu.children);
      }

      return formattedMenu;
    });
  }
}
