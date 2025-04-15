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
      select: ['id', 'username', 'password', 'nickname', 'avatar', 'email', 'status'],
    });
  }

  /**
   * 根据ID查找用户
   */
  async findById(id: number): Promise<User> {
    return this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'nickname', 'avatar', 'email', 'status'],
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
    return this.userRepository.save(newUser);
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
}
