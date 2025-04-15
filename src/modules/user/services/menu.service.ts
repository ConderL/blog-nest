import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Menu } from '../entities/menu.entity';
import { RoleMenu } from '../entities/role-menu.entity';

@Injectable()
export class MenuService {
  constructor(
    @InjectRepository(Menu)
    private readonly menuRepository: Repository<Menu>,
    @InjectRepository(RoleMenu)
    private readonly roleMenuRepository: Repository<RoleMenu>,
  ) {}

  /**
   * 创建菜单
   */
  async create(menu: Partial<Menu>): Promise<Menu> {
    const newMenu = this.menuRepository.create(menu);
    return this.menuRepository.save(newMenu);
  }

  /**
   * 更新菜单
   */
  async update(id: number, menu: Partial<Menu>): Promise<Menu> {
    await this.menuRepository.update(id, menu);
    return this.findById(id);
  }

  /**
   * 删除菜单
   */
  async remove(id: number): Promise<void> {
    // 先检查是否有子菜单
    const childrenCount = await this.menuRepository.count({ where: { parentId: id } });
    if (childrenCount > 0) {
      throw new Error('该菜单下有子菜单，无法删除');
    }

    // 删除菜单与角色的关联
    await this.roleMenuRepository.delete({ menuId: id });

    // 删除菜单
    await this.menuRepository.delete(id);
  }

  /**
   * 获取所有菜单
   */
  async findAll(): Promise<Menu[]> {
    return this.menuRepository.find({
      order: { parentId: 'ASC', orderNum: 'ASC' },
    });
  }

  /**
   * 获取菜单树
   */
  async findTree(): Promise<Menu[]> {
    const menus = await this.findAll();
    return this.buildTree(menus);
  }

  /**
   * 构建菜单树
   */
  private buildTree(menus: Menu[]): Menu[] {
    const result: Menu[] = [];
    const map = {};

    // 创建一个临时的Map，将所有菜单按ID映射
    menus.forEach((item) => {
      map[item.id] = { ...item, children: [] };
    });

    // 构建树结构
    menus.forEach((item) => {
      if (item.parentId === 0) {
        // 根菜单
        result.push(map[item.id]);
      } else {
        // 子菜单，添加到父菜单的children中
        if (map[item.parentId]) {
          map[item.parentId].children.push(map[item.id]);
        }
      }
    });

    return result;
  }

  /**
   * 根据ID获取菜单
   */
  async findById(id: number): Promise<Menu> {
    return this.menuRepository.findOne({ where: { id } });
  }

  /**
   * 根据角色ID获取菜单
   */
  async findByRoleIds(roleIds: number[]): Promise<Menu[]> {
    if (roleIds.length === 0) return [];

    // 查询角色拥有的菜单ID
    const roleMenus = await this.roleMenuRepository.find({ where: { roleId: In(roleIds) } });
    const menuIds = roleMenus.map((rm) => rm.menuId);

    if (menuIds.length === 0) return [];

    // 查询菜单详情
    return this.menuRepository.find({
      where: { id: In(menuIds) },
      order: { parentId: 'ASC', orderNum: 'ASC' },
    });
  }

  /**
   * 获取角色的菜单树
   */
  async findTreeByRoleIds(roleIds: number[]): Promise<Menu[]> {
    const menus = await this.findByRoleIds(roleIds);
    return this.buildTree(menus);
  }
}
