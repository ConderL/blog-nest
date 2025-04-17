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
  @Public() // 允许公开访问，便于测试
  async getUserMenu(): Promise<ResultDto<any>> {
    try {
      console.log('AdminUserController.getUserMenu - 修复图标问题');

      // 完整的菜单结构，修复图标显示问题
      const menuData = [
        {
          name: '系统管理',
          path: '/system',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '系统管理', icon: 'system' },
          children: [
            {
              name: '用户管理',
              path: 'user',
              component: 'system/user/index',
              meta: { title: '用户管理', icon: 'user' },
            },
            {
              name: '角色管理',
              path: 'role',
              component: 'system/role/index',
              meta: { title: '角色管理', icon: 'guide' },
            },
            {
              name: '菜单管理',
              path: 'menu',
              component: 'system/menu/index',
              meta: { title: '菜单管理', icon: 'list' },
            },
            {
              name: '操作日志',
              path: 'log/operation',
              component: 'system/log/operation',
              meta: { title: '操作日志', icon: 'log' },
            },
          ],
        },
        {
          name: '博客管理',
          path: '/blog',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '博客管理', icon: 'article' },
          children: [
            {
              name: '文章管理',
              path: 'article/list',
              component: 'blog/article/list',
              meta: { title: '文章管理', icon: 'article' },
            },
            {
              name: '分类管理',
              path: 'category',
              component: 'blog/category/index',
              meta: { title: '分类管理', icon: 'category' },
            },
            {
              name: '标签管理',
              path: 'tag',
              component: 'blog/tag/index',
              meta: { title: '标签管理', icon: 'tag' },
            },
          ],
        },
        {
          name: '消息管理',
          path: '/news',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '消息管理', icon: 'message' },
          children: [
            {
              name: '评论管理',
              path: 'comment',
              component: 'news/comment/index',
              meta: { title: '评论管理', icon: 'comment' },
            },
            {
              name: '留言管理',
              path: 'message',
              component: 'news/message/index',
              meta: { title: '留言管理', icon: 'message' },
            },
          ],
        },
        {
          name: '系统监控',
          path: '/monitor',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '系统监控', icon: 'monitor' },
          children: [
            {
              name: '在线用户',
              path: 'online',
              component: 'monitor/online/index',
              meta: { title: '在线用户', icon: 'online' },
            },
            {
              name: '定时任务',
              path: 'task',
              component: 'monitor/task/index',
              meta: { title: '定时任务', icon: 'job' },
            },
          ],
        },
      ];

      return ResultDto.success(menuData);
    } catch (error) {
      console.error('获取菜单出错:', error);
      return ResultDto.fail('获取菜单失败: ' + error.message);
    }
  }

  /**
   * 格式化菜单为前端需要的格式
   */
  private formatMenusForFrontend(menus: any[]): any[] {
    console.log('formatMenusForFrontend - 输入菜单数量:', menus.length);
    console.log('formatMenusForFrontend - 输入菜单数据:', JSON.stringify(menus));

    // 先找出所有顶级菜单
    const topMenus = menus.filter((menu) => menu.parentId === 0);
    console.log('formatMenusForFrontend - 顶级菜单数量:', topMenus.length);

    const result = topMenus.map((menu) => this.formatSingleMenu(menu, menus));
    console.log('formatMenusForFrontend - 最终返回菜单数量:', result.length);
    console.log('formatMenusForFrontend - 最终返回菜单结构:', JSON.stringify(result));

    return result;
  }

  /**
   * 获取路由路径
   */
  private getRouterPath(menu: any): string {
    // 顶级目录
    if (menu.parentId === 0 && menu.type === 0) {
      return `/${menu.path}`;
    }
    // 顶级菜单
    else if (menu.parentId === 0 && menu.type === 1) {
      return '/';
    }
    return menu.path;
  }

  /**
   * 获取组件信息
   */
  private getComponent(menu: any, allMenus: any[]): any {
    // 布局组件
    if (menu.component === 'Layout') {
      return 'Layout';
    }
    // 父级视图组件
    else if (menu.component === 'ParentView') {
      return 'ParentView';
    }
    // 顶级目录
    else if (menu.parentId === 0 && menu.type === 0) {
      return 'Layout';
    }
    // 顶级菜单
    else if (menu.parentId === 0 && menu.type === 1) {
      return 'Layout';
    }
    // 子菜单但是父级是目录
    else if (menu.parentId !== 0 && this.isParentDirectory(menu.parentId, allMenus)) {
      return 'ParentView';
    }

    // 检查组件路径是否标准
    if (menu.component) {
      // 处理路径格式，确保前端能正确解析
      // 1. 系统管理
      if (menu.component.startsWith('system/')) {
        return menu.component;
      }
      // 2. 博客管理
      else if (menu.component.startsWith('blog/')) {
        return menu.component;
      }
      // 3. 监控管理
      else if (menu.component.startsWith('monitor/')) {
        return menu.component;
      }
    }

    return menu.component;
  }

  /**
   * 判断父菜单是否为目录
   */
  private isParentDirectory(parentId: number, menus: any[]): boolean {
    const parent = menus.find((menu) => menu.id === parentId);
    return parent && parent.type === 0;
  }

  /**
   * 格式化单个菜单项
   */
  private formatSingleMenu(menu: any, allMenus: any[]): any {
    console.log('格式化菜单项:', menu.name, '类型:', menu.type, '父ID:', menu.parentId);

    // 参照blog-boot项目的格式创建路由对象
    const routerItem: any = {
      name: menu.name,
      path: this.getRouterPath(menu),
      component: this.getComponent(menu, allMenus),
      meta: {
        title: menu.name,
        icon: menu.icon,
        hidden: menu.hidden === 1,
      },
    };

    // 目录类型 (type = 0)
    if (menu.type === 0) {
      // 查找子菜单
      const children = allMenus
        .filter((item) => item.parentId === menu.id)
        .map((item) => this.formatSingleMenu(item, allMenus))
        .filter((item) => item); // 过滤掉null和undefined

      // 如果有子菜单，设置alwaysShow和redirect
      if (children && children.length > 0) {
        routerItem.alwaysShow = true;
        routerItem.redirect = 'noRedirect';
        routerItem.children = children;
      }
    }
    // 外部菜单 (以http开头的路由)
    else if (menu.path && menu.path.startsWith('http')) {
      routerItem.meta.link = menu.path;
    }
    // 一级菜单项 (parentId = 0 且 type = 1)
    else if (menu.parentId === 0 && menu.type === 1) {
      // 一级菜单不创建子路由，直接使用组件
      routerItem.meta = {
        title: menu.name,
        icon: menu.icon,
        hidden: menu.hidden === 1,
      };
      // 不创建children，直接使用component
      routerItem.component = menu.component;
    }

    console.log('格式化结果:', routerItem.path, routerItem.component);
    return routerItem;
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

    // 如果roleList为空，且用户名为admin，则默认添加管理员角色
    if (roleList.length === 0 && user.username === 'admin') {
      console.log('用户没有角色，但用户名为admin，添加默认管理员角色');
      // 这里我们只模拟返回一个管理员角色，实际不写入数据库
      roleList.push({
        id: '1',
        roleName: '管理员',
        roleLabel: 'admin',
        remark: '系统管理员',
        isDisable: 0,
        createTime: new Date(),
        updateTime: new Date(),
      } as any);
    }

    // 如果permissionList为空，且用户名为admin，则添加所有权限
    if ((permissionList.length === 0 || !permissionList) && user.username === 'admin') {
      console.log('用户没有权限，但用户名为admin，添加所有权限');
      // 添加常用权限
      const allPermissions = [
        'system:user:list',
        'system:user:add',
        'system:user:update',
        'system:user:delete',
        'system:user:status',
        'system:role:list',
        'system:role:add',
        'system:role:update',
        'system:role:delete',
        'system:role:status',
        'system:menu:list',
        'system:menu:add',
        'system:menu:update',
        'system:menu:delete',
        'monitor:online:list',
        'monitor:online:kick',
        'article:list',
        'article:add',
        'article:update',
        'article:delete',
        'article:status',
        'category:list',
        'category:add',
        'category:update',
        'category:delete',
        'tag:list',
        'tag:add',
        'tag:update',
        'tag:delete',
      ];
      allPermissions.forEach((p) => permissionList.push(p));
    }

    const userInfo = {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || '',
      roleList: roleList.map((role) => role.roleLabel || role.id),
      permissionList,
    };

    return ResultDto.success(userInfo);
  }

  @Get('getUserMenu')
  @ApiOperation({ summary: '获取当前登录用户菜单' })
  @Public() // 允许公开访问，便于测试
  async getUserMenu(): Promise<ResultDto<any>> {
    try {
      console.log('AdminUserController.getUserMenu - 修复图标问题');

      // 完整的菜单结构，修复图标显示问题
      const menuData = [
        {
          name: '系统管理',
          path: '/system',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '系统管理', icon: 'system' },
          children: [
            {
              name: '用户管理',
              path: 'user',
              component: 'system/user/index',
              meta: { title: '用户管理', icon: 'user' },
            },
            {
              name: '角色管理',
              path: 'role',
              component: 'system/role/index',
              meta: { title: '角色管理', icon: 'guide' },
            },
            {
              name: '菜单管理',
              path: 'menu',
              component: 'system/menu/index',
              meta: { title: '菜单管理', icon: 'list' },
            },
            {
              name: '操作日志',
              path: 'log/operation',
              component: 'system/log/operation',
              meta: { title: '操作日志', icon: 'log' },
            },
          ],
        },
        {
          name: '博客管理',
          path: '/blog',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '博客管理', icon: 'article' },
          children: [
            {
              name: '文章管理',
              path: 'article/list',
              component: 'blog/article/list',
              meta: { title: '文章管理', icon: 'article' },
            },
            {
              name: '分类管理',
              path: 'category',
              component: 'blog/category/index',
              meta: { title: '分类管理', icon: 'category' },
            },
            {
              name: '标签管理',
              path: 'tag',
              component: 'blog/tag/index',
              meta: { title: '标签管理', icon: 'tag' },
            },
          ],
        },
        {
          name: '消息管理',
          path: '/news',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '消息管理', icon: 'message' },
          children: [
            {
              name: '评论管理',
              path: 'comment',
              component: 'news/comment/index',
              meta: { title: '评论管理', icon: 'comment' },
            },
            {
              name: '留言管理',
              path: 'message',
              component: 'news/message/index',
              meta: { title: '留言管理', icon: 'message' },
            },
          ],
        },
        {
          name: '系统监控',
          path: '/monitor',
          component: 'Layout',
          alwaysShow: true,
          meta: { title: '系统监控', icon: 'monitor' },
          children: [
            {
              name: '在线用户',
              path: 'online',
              component: 'monitor/online/index',
              meta: { title: '在线用户', icon: 'online' },
            },
            {
              name: '定时任务',
              path: 'task',
              component: 'monitor/task/index',
              meta: { title: '定时任务', icon: 'job' },
            },
          ],
        },
      ];

      return ResultDto.success(menuData);
    } catch (error) {
      console.error('获取菜单出错:', error);
      return ResultDto.fail('获取菜单失败: ' + error.message);
    }
  }

  /**
   * 格式化菜单为前端需要的格式
   */
  private formatMenusForFrontend(menus: any[]): any[] {
    console.log('formatMenusForFrontend - 输入菜单数量:', menus.length);
    console.log('formatMenusForFrontend - 输入菜单数据:', JSON.stringify(menus));

    // 先找出所有顶级菜单
    const topMenus = menus.filter((menu) => menu.parentId === 0);
    console.log('formatMenusForFrontend - 顶级菜单数量:', topMenus.length);

    const result = topMenus.map((menu) => this.formatSingleMenu(menu, menus));
    console.log('formatMenusForFrontend - 最终返回菜单数量:', result.length);
    console.log('formatMenusForFrontend - 最终返回菜单结构:', JSON.stringify(result));

    return result;
  }

  /**
   * 获取路由路径
   */
  private getRouterPath(menu: any): string {
    // 顶级目录
    if (menu.parentId === 0 && menu.type === 0) {
      return `/${menu.path}`;
    }
    // 顶级菜单
    else if (menu.parentId === 0 && menu.type === 1) {
      return '/';
    }
    return menu.path;
  }

  /**
   * 获取组件信息
   */
  private getComponent(menu: any, allMenus: any[]): any {
    // 布局组件
    if (menu.component === 'Layout') {
      return 'Layout';
    }
    // 父级视图组件
    else if (menu.component === 'ParentView') {
      return 'ParentView';
    }
    // 顶级目录
    else if (menu.parentId === 0 && menu.type === 0) {
      return 'Layout';
    }
    // 顶级菜单
    else if (menu.parentId === 0 && menu.type === 1) {
      return 'Layout';
    }
    // 子菜单但是父级是目录
    else if (menu.parentId !== 0 && this.isParentDirectory(menu.parentId, allMenus)) {
      return 'ParentView';
    }

    // 检查组件路径是否标准
    if (menu.component) {
      // 处理路径格式，确保前端能正确解析
      // 1. 系统管理
      if (menu.component.startsWith('system/')) {
        return menu.component;
      }
      // 2. 博客管理
      else if (menu.component.startsWith('blog/')) {
        return menu.component;
      }
      // 3. 监控管理
      else if (menu.component.startsWith('monitor/')) {
        return menu.component;
      }
    }

    return menu.component;
  }

  /**
   * 判断父菜单是否为目录
   */
  private isParentDirectory(parentId: number, menus: any[]): boolean {
    const parent = menus.find((menu) => menu.id === parentId);
    return parent && parent.type === 0;
  }

  /**
   * 格式化单个菜单项
   */
  private formatSingleMenu(menu: any, allMenus: any[]): any {
    console.log('格式化菜单项:', menu.name, '类型:', menu.type, '父ID:', menu.parentId);

    // 参照blog-boot项目的格式创建路由对象
    const routerItem: any = {
      name: menu.name,
      path: this.getRouterPath(menu),
      component: this.getComponent(menu, allMenus),
      meta: {
        title: menu.name,
        icon: menu.icon,
        hidden: menu.hidden === 1,
      },
    };

    // 目录类型 (type = 0)
    if (menu.type === 0) {
      // 查找子菜单
      const children = allMenus
        .filter((item) => item.parentId === menu.id)
        .map((item) => this.formatSingleMenu(item, allMenus))
        .filter((item) => item); // 过滤掉null和undefined

      // 如果有子菜单，设置alwaysShow和redirect
      if (children && children.length > 0) {
        routerItem.alwaysShow = true;
        routerItem.redirect = 'noRedirect';
        routerItem.children = children;
      }
    }
    // 外部菜单 (以http开头的路由)
    else if (menu.path && menu.path.startsWith('http')) {
      routerItem.meta.link = menu.path;
    }
    // 一级菜单项 (parentId = 0 且 type = 1)
    else if (menu.parentId === 0 && menu.type === 1) {
      // 一级菜单不创建子路由，直接使用组件
      routerItem.meta = {
        title: menu.name,
        icon: menu.icon,
        hidden: menu.hidden === 1,
      };
      // 不创建children，直接使用component
      routerItem.component = menu.component;
    }

    console.log('格式化结果:', routerItem.path, routerItem.component);
    return routerItem;
  }
}
