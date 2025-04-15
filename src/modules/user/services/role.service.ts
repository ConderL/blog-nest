import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Role } from '../entities/role.entity';
import { UserRole } from '../entities/user-role.entity';
import { RoleMenu } from '../entities/role-menu.entity';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
    @InjectRepository(UserRole)
    private readonly userRoleRepository: Repository<UserRole>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepository: Repository<RoleMenu>,
  ) {}

  /**
   * 创建角色
   */
  async create(role: Partial<Role>): Promise<Role> {
    const newRole = this.roleRepository.create(role);
    return this.roleRepository.save(newRole);
  }

  /**
   * 更新角色
   */
  async update(id: number, role: Partial<Role>): Promise<Role> {
    await this.roleRepository.update(id, role);
    return this.findById(id);
  }

  /**
   * 删除角色
   */
  async remove(id: number): Promise<void> {
    // 删除角色与用户的关联
    await this.userRoleRepository.delete({ roleId: id });
    // 删除角色与菜单的关联
    await this.roleMenuRepository.delete({ roleId: id });
    // 删除角色
    await this.roleRepository.delete(id);
  }

  /**
   * 获取所有角色
   */
  async findAll(): Promise<Role[]> {
    return this.roleRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * 根据ID获取角色
   */
  async findById(id: number): Promise<Role> {
    return this.roleRepository.findOne({ where: { id } });
  }

  /**
   * 根据用户ID获取角色
   */
  async findByUserId(userId: number): Promise<Role[]> {
    const userRoles = await this.userRoleRepository.find({ where: { userId } });
    const roleIds = userRoles.map((ur) => ur.roleId);
    if (roleIds.length === 0) return [];
    return this.roleRepository.find({ where: { id: In(roleIds) } });
  }

  /**
   * 分配角色菜单权限
   */
  async assignMenus(roleId: number, menuIds: number[]): Promise<void> {
    // 先删除原有权限
    await this.roleMenuRepository.delete({ roleId });

    // 添加新权限
    const roleMenus = menuIds.map((menuId) => ({
      roleId,
      menuId,
    }));

    if (roleMenus.length > 0) {
      await this.roleMenuRepository.insert(roleMenus);
    }
  }

  /**
   * 为用户分配角色
   */
  async assignUserRoles(userId: number, roleIds: number[]): Promise<void> {
    // 先删除用户原有角色
    await this.userRoleRepository.delete({ userId });

    // 添加新角色
    const userRoles = roleIds.map((roleId) => ({
      userId,
      roleId,
    }));

    if (userRoles.length > 0) {
      await this.userRoleRepository.insert(userRoles);
    }
  }
}
