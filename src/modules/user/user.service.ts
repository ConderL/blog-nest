import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { Menu } from './entities/menu.entity';
import { RoleMenu } from './entities/role-menu.entity';
import * as bcrypt from 'bcryptjs';
import { UploadService } from '../upload/services/upload/upload.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepository: Repository<RoleMenu>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * 根据用户名查找用户
   */
  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'password', 'nickname', 'avatar', 'email'],
    });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'nickname', 'avatar', 'email', 'webSite', 'intro'],
    });
  }

  /**
   * 根据邮箱查找用户
   */
  async findByEmail(email: string): Promise<User> {
    return this.userRepository.findOne({
      where: { email },
      select: [
        'id',
        'username',
        'password',
        'nickname',
        'avatar',
        'email',
        'isDisable',
        'loginType',
      ],
    });
  }

  /**
   * 创建用户
   */
  async create(user: Partial<User>): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { username: user.username } });
    if (existingUser) {
      throw new Error('用户名已存在');
    }

    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    const newUser = this.userRepository.create(user);
    const savedUser = await this.userRepository.save(newUser);

    // 为新用户添加角色
    await this.addUserRole(savedUser.id);

    return savedUser;
  }

  /**
   * 创建用户（用于邮箱注册）
   */
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    nickname: string;
    loginType: number;
  }): Promise<User> {
    // 检查用户名是否存在
    const existingUser = await this.userRepository.findOne({
      where: [{ username: userData.username }, { email: userData.email }],
    });

    if (existingUser) {
      throw new Error('用户名或邮箱已存在');
    }

    // 创建新用户
    const newUser = this.userRepository.create({
      username: userData.username,
      email: userData.email,
      password: userData.password, // 已经在AuthService中进行了加密处理
      nickname: userData.nickname,
      loginType: userData.loginType,
      isDisable: 0, // 默认启用
      createTime: new Date(), // 设置创建时间为当前时间
      avatar: '', // 设置默认头像为空字符串
    });

    // 保存用户
    const savedUser = await this.userRepository.save(newUser);

    // 为新用户添加角色
    await this.addUserRole(savedUser.id);

    return this.findById(savedUser.id);
  }

  /**
   * 为用户添加角色并分配权限
   */
  private async addUserRole(userId: number): Promise<void> {
    try {
      // 1. 查找或创建游客角色
      let visitorRole = await this.roleRepository.findOne({ where: { roleLabel: 'visitor' } });

      if (!visitorRole) {
        // 创建游客角色
        const newRole = this.roleRepository.create({
          roleName: '游客',
          roleLabel: 'visitor',
          remark: '游客角色，只能访问博客和消息管理',
        });
        visitorRole = await this.roleRepository.save(newRole);
        console.log('创建了新的游客角色:', visitorRole.id);
      }

      // 2. 为用户分配游客角色
      const userRole = new UserRole();
      userRole.userId = userId;
      userRole.roleId = visitorRole.id;
      await this.userRoleRepository.save(userRole);
      console.log(`用户 ${userId} 已分配游客角色 ${visitorRole.id}`);

      // 3. 查找博客管理和消息管理相关菜单
      const blogMenus = await this.menuRepository.find({
        where: [{ name: '博客管理' }, { name: '消息管理' }],
      });

      if (blogMenus && blogMenus.length > 0) {
        // 获取这些父菜单的ID
        const parentMenuIds = blogMenus.map((menu) => menu.id);

        // 查找这些父菜单下的子菜单
        const childMenus = await this.menuRepository.find({
          where: { parentId: In(parentMenuIds) },
        });

        // 合并父菜单和子菜单
        const allMenus = [...blogMenus, ...childMenus];

        // 为角色分配这些菜单权限
        for (const menu of allMenus) {
          // 检查该权限是否已存在
          const existingRoleMenu = await this.roleMenuRepository.findOne({
            where: {
              roleId: visitorRole.id,
              menuId: menu.id,
            },
          });

          if (!existingRoleMenu) {
            const roleMenu = new RoleMenu();
            roleMenu.roleId = visitorRole.id;
            roleMenu.menuId = menu.id;
            await this.roleMenuRepository.save(roleMenu);
          }
        }

        console.log(`已为游客角色分配 ${allMenus.length} 个菜单权限`);
      } else {
        console.log('未找到博客管理或消息管理相关菜单');
      }
    } catch (error) {
      console.error('为用户添加角色时出错:', error);
    }
  }

  /**
   * 更新用户
   */
  async update(id: number, user: Partial<User>): Promise<User> {
    if (user.password) {
      user.password = await bcrypt.hash(user.password, 10);
    }
    await this.userRepository.update(id, user);
    return this.findById(id);
  }

  /**
   * 获取用户角色列表
   */
  async getUserRoles(userId: number): Promise<Role[]> {
    // 查找用户-角色关联
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    // 获取角色ID
    const roleIds = userRoles.map((ur) => ur.roleId);

    // 查询角色信息
    return this.roleRepository.find({
      where: { id: In(roleIds) },
    });
  }

  /**
   * 获取用户权限列表
   */
  async getUserPermissions(userId: number): Promise<string[]> {
    // 首先获取用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    if (!userRoles || userRoles.length === 0) {
      return [];
    }

    const roleIds = userRoles.map((ur) => ur.roleId);

    // 查询这些角色所拥有的菜单ID
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId: In(roleIds) },
    });

    if (!roleMenus || roleMenus.length === 0) {
      return [];
    }

    // 获取菜单ID
    const menuIds = roleMenus.map((rm) => rm.menuId);

    // 查询菜单信息
    const menus = await this.menuRepository.find({
      where: { id: In(menuIds) },
    });

    // 提取权限标识
    const permissions = menus
      .map((menu) => menu.perms)
      .filter((perms) => perms) // 过滤空值
      .flatMap((perms) => perms.split(','))
      .filter((value, index, self) => self.indexOf(value) === index); // 去重

    return permissions;
  }

  /**
   * 获取用户菜单树
   */
  async getUserMenuTree(userId: number): Promise<any[]> {
    console.log('UserService.getUserMenuTree - 获取用户菜单, 用户ID:', userId);

    // 获取用户角色
    const userRoles = await this.userRoleRepository.find({
      where: { userId },
    });

    if (!userRoles || userRoles.length === 0) {
      console.log('UserService.getUserMenuTree - 未找到用户角色, 返回空数组');
      return [];
    }

    const roleIds = userRoles.map((ur) => ur.roleId);
    console.log('UserService.getUserMenuTree - 找到用户角色IDs:', roleIds);

    // 查询这些角色所拥有的菜单ID
    const roleMenus = await this.roleMenuRepository.find({
      where: { roleId: In(roleIds) },
    });

    if (!roleMenus || roleMenus.length === 0) {
      console.log('UserService.getUserMenuTree - 未找到角色菜单, 返回空数组');
      return [];
    }

    // 获取菜单ID
    const menuIds = roleMenus.map((rm) => rm.menuId);
    console.log('UserService.getUserMenuTree - 菜单IDs数量:', menuIds.length);

    // 查询菜单信息 - 只查询类型为M(目录)和C(菜单)的项，排除F(按钮)类型
    // 并且排除is_hidden=1的菜单项
    const menus = await this.menuRepository.find({
      where: {
        id: In(menuIds),
        type: In(['M', 'C']), // 仅查询目录和菜单类型
      },
      order: { parentId: 'ASC', orderNum: 'ASC' },
    });
    console.log('UserService.getUserMenuTree - 查询到菜单数量(仅目录和菜单):', menus.length);

    // 构建菜单树
    return this.buildMenuTree(menus);
  }

  /**
   * 构建菜单树
   */
  private buildMenuTree(menus: Menu[]): any[] {
    console.log('UserService.buildMenuTree - 开始构建菜单树，菜单数量:', menus.length);

    const result = [];
    const map = {};

    // 创建映射
    menus.forEach((menu) => {
      // 创建新对象避免修改原始实体，并使用类型断言
      const menuItem: any = {
        ...menu,
        children: [],
        // 确保前端属性名称一致
        hidden: menu.isHidden === 1 ? true : false,
      };

      // 添加前端路由需要的额外属性
      if (menu.type === 'M') {
        // 目录类型
        menuItem.redirect = 'noRedirect';
        menuItem.alwaysShow = true;
      }

      map[menu.id] = menuItem;
    });

    // 构建树结构
    menus.forEach((menu) => {
      if (menu.parentId === 0) {
        // 根菜单
        result.push(map[menu.id]);
      } else {
        // 子菜单
        if (map[menu.parentId]) {
          map[menu.parentId].children.push(map[menu.id]);
        } else {
          console.log(`警告: 菜单 ${menu.name}(ID=${menu.id}) 的父菜单 ID=${menu.parentId} 不存在`);
        }
      }
    });

    console.log('UserService.buildMenuTree - 完成构建，根菜单数量:', result.length);
    // 打印菜单结构用于调试
    result.forEach((menu) => {
      console.log(`- ${menu.name} (ID=${menu.id}, ${menu.children.length}个子菜单)`);
      menu.children.forEach((child) => {
        console.log(`  * ${child.name} (ID=${child.id})`);
      });
    });

    return result;
  }

  /**
   * 获取用户角色列表选项
   */
  async getUserRoleOptions(): Promise<any[]> {
    try {
      // 查找所有可用的角色
      const roles = await this.roleRepository.find({
        where: { isDisable: 0 },
        order: { createTime: 'DESC' },
      });

      // 格式化为前端需要的数据格式
      return roles.map((role) => ({
        id: role.id,
        roleName: role.roleName,
        roleLabel: role.roleName, // 使用roleName作为roleLabel
      }));
    } catch (error) {
      console.error('获取角色选项失败:', error);
      throw new Error('获取角色选项失败');
    }
  }

  /**
   * 为用户分配角色
   * @param userId 用户ID
   * @param roleIds 角色ID数组
   */
  async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
    try {
      // 检查用户是否存在
      const user = await this.findById(userId);
      if (!user) {
        throw new Error(`用户ID ${userId} 不存在`);
      }

      console.log(`为用户ID ${userId} 分配角色: ${roleIds.join(',')}`);

      // 删除用户当前所有角色
      await this.userRoleRepository.delete({ userId });

      // 如果没有角色要分配，直接返回
      if (!roleIds || roleIds.length === 0) {
        return;
      }

      // 添加新的用户角色关联
      const userRoles = roleIds.map((roleId) =>
        this.userRoleRepository.create({
          userId,
          roleId,
        }),
      );

      // 保存用户角色关联
      await this.userRoleRepository.save(userRoles);
      console.log(`用户 ${userId} 的角色已更新`);
    } catch (error) {
      console.error('为用户分配角色失败:', error);
      throw error;
    }
  }

  /**
   * 查询用户拥有的角色ID列表
   * @param userId 用户ID
   */
  async getUserRoleIds(userId: number): Promise<number[]> {
    try {
      // 检查用户是否存在
      const user = await this.findById(userId);
      if (!user) {
        throw new Error(`用户ID ${userId} 不存在`);
      }

      // 查询用户角色关联
      const userRoles = await this.userRoleRepository.find({ where: { userId } });

      // 返回角色ID列表
      return userRoles.map((ur) => Number(ur.roleId));
    } catch (error) {
      console.error('获取用户角色ID列表失败:', error);
      throw error;
    }
  }

  /**
   * 更新用户头像
   * @param userId 用户ID
   * @param file 头像文件
   * @returns 头像URL
   */
  async updateUserAvatar(userId: number, file: Express.Multer.File): Promise<string> {
    console.log(`更新用户头像，用户ID: ${userId}`);

    // 查询用户
    const user = await this.findById(userId);
    if (!user) {
      throw new Error('用户不存在');
    }

    try {
      // 上传头像文件，使用avatar类型
      const result = await this.uploadService.uploadFile(file, 'avatar');

      // 更新用户头像
      await this.userRepository.update(userId, { avatar: result.url });

      console.log(`用户 ${userId} 头像更新成功: ${result.url}`);

      // 返回新头像URL
      return result.url;
    } catch (error) {
      console.error(`更新用户头像失败: ${error.message}`, error);
      throw new Error(`更新头像失败: ${error.message}`);
    }
  }

  /**
   * 修改用户状态（启用/禁用）
   * @param userId 用户ID
   * @param isDisable 是否禁用 (0启用 1禁用)
   */
  async changeUserStatus(userId: number, isDisable: number): Promise<void> {
    try {
      console.log(`修改用户状态，用户ID: ${userId}, 状态: ${isDisable}`);

      // 检查用户是否存在
      const user = await this.findById(userId);
      if (!user) {
        throw new Error(`用户ID ${userId} 不存在`);
      }

      // 如果是管理员用户，不允许禁用
      if (user.username === 'admin' && isDisable === 1) {
        throw new Error('不能禁用系统管理员账号');
      }

      // 更新用户状态
      await this.userRepository.update(userId, { isDisable });
      console.log(`用户 ${userId} 状态已更新为: ${isDisable === 1 ? '禁用' : '启用'}`);
    } catch (error) {
      console.error('修改用户状态失败:', error);
      throw error;
    }
  }

  /**
   * 分页查询用户列表
   * @param pageNum 当前页码
   * @param pageSize 每页大小
   * @param username 用户名（可选）
   * @param nickname 昵称（可选）
   * @param email 邮箱（可选）
   * @param loginType 登录方式（可选）
   * @param isDisable 是否禁用（可选）
   */
  async getUserList(
    pageNum: number = 1,
    pageSize: number = 10,
    username?: string,
    nickname?: string,
    email?: string,
    loginType?: number,
    isDisable?: number,
  ): Promise<{ recordList: any[]; total: number }> {
    try {
      console.log('查询用户列表，参数:', {
        pageNum,
        pageSize,
        username,
        nickname,
        email,
        loginType,
        isDisable,
      });

      // 构建查询条件
      const queryBuilder = this.userRepository.createQueryBuilder('user');

      // 添加WHERE条件
      if (username) {
        queryBuilder.andWhere('user.username LIKE :username', { username: `%${username}%` });
      }
      if (nickname) {
        queryBuilder.andWhere('user.nickname LIKE :nickname', { nickname: `%${nickname}%` });
      }
      if (email) {
        queryBuilder.andWhere('user.email LIKE :email', { email: `%${email}%` });
      }
      if (loginType !== undefined) {
        queryBuilder.andWhere('user.loginType = :loginType', { loginType });
      }
      if (isDisable !== undefined) {
        queryBuilder.andWhere('user.isDisable = :isDisable', { isDisable });
      }

      // 设置排序
      queryBuilder.orderBy('user.createTime', 'DESC');

      // 获取总数
      const total = await queryBuilder.getCount();

      // 分页查询
      const list = await queryBuilder
        .skip((pageNum - 1) * pageSize)
        .take(pageSize)
        .select([
          'user.id',
          'user.username',
          'user.nickname',
          'user.avatar',
          'user.email',
          'user.webSite',
          'user.intro',
          'user.loginType',
          'user.isDisable',
          'user.ipAddress',
          'user.ipSource',
          'user.loginTime',
          'user.createTime',
          'user.updateTime',
        ])
        .getMany();

      console.log(`查询到用户列表: ${list.length}条，总数: ${total}`);

      // 格式化返回结果
      const formattedList = list.map((user) => ({
        ...user,
        avatar: user.avatar || '',
        webSite: user.webSite || '',
        intro: user.intro || '',
        email: user.email || '',
        ipAddress: user.ipAddress || '',
        ipSource: user.ipSource || '',
      }));

      return { recordList: formattedList, total };
    } catch (error) {
      console.error('获取用户列表失败:', error);
      throw new Error('获取用户列表失败: ' + error.message);
    }
  }
}
