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
    console.log('MenuService.findTree - 开始查询所有菜单');
    const menus = await this.findAll();
    console.log('MenuService.findTree - 查询到菜单数量:', menus.length);

    const tree = this.buildTree(menus);
    console.log('MenuService.findTree - 构建的菜单树数量:', tree.length);

    return tree;
  }

  /**
   * 构建菜单树
   */
  private buildTree(menus: Menu[]): Menu[] {
    console.log('MenuService.buildTree - 开始构建菜单树，输入菜单数量:', menus.length);
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

    console.log('MenuService.buildTree - 构建完成，菜单树根节点数量:', result.length);
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
    console.log('MenuService.findByRoleIds - 开始查询角色菜单, 角色IDs:', roleIds);

    if (roleIds.length === 0) {
      console.log('MenuService.findByRoleIds - 角色ID为空，返回空数组');
      return [];
    }

    // 查询角色拥有的菜单ID
    const roleMenus = await this.roleMenuRepository.find({ where: { roleId: In(roleIds) } });
    console.log('MenuService.findByRoleIds - 查询到角色菜单关联数据:', roleMenus.length);

    const menuIds = roleMenus.map((rm) => rm.menuId);
    console.log('MenuService.findByRoleIds - 提取出菜单ID:', menuIds);

    if (menuIds.length === 0) {
      console.log('MenuService.findByRoleIds - 菜单ID为空，返回空数组');
      return [];
    }

    // 查询菜单详情
    const menus = await this.menuRepository.find({
      where: { id: In(menuIds) },
      order: { parentId: 'ASC', orderNum: 'ASC' },
    });
    console.log('MenuService.findByRoleIds - 查询到菜单数量:', menus.length);

    return menus;
  }

  /**
   * 获取角色的菜单树
   */
  async findTreeByRoleIds(roleIds: number[]): Promise<Menu[]> {
    console.log('MenuService.findTreeByRoleIds - 开始查询角色菜单树, 角色IDs:', roleIds);

    const menus = await this.findByRoleIds(roleIds);
    console.log('MenuService.findTreeByRoleIds - 查询到菜单数量:', menus.length);

    const tree = this.buildTree(menus);
    console.log('MenuService.findTreeByRoleIds - 构建的菜单树数量:', tree.length);

    return tree;
  }
}
