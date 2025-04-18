import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from './entities/user.entity';
import { Role } from './entities/role.entity';
import { UserRole } from './entities/user-role.entity';
import { Menu } from './entities/menu.entity';
import { RoleMenu } from './entities/role-menu.entity';
import * as bcrypt from 'bcryptjs';

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
      select: ['id', 'username', 'nickname', 'avatar', 'email'],
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
}
