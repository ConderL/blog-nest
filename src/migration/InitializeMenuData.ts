import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * 初始化菜单数据和角色菜单关联
 */
export class InitializeMenuData1718500001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('开始初始化菜单数据...');

    // 1. 获取管理员角色ID
    const [roleRows] = await queryRunner.query('SELECT * FROM roles WHERE role_label = ?', [
      'admin',
    ]);

    if (!roleRows || roleRows.length === 0) {
      console.log('错误: 未找到管理员角色，请先运行InitializeMigrateData迁移');
      return;
    }

    const adminRoleId = roleRows[0].id;
    console.log('找到管理员角色，ID:', adminRoleId);

    // 2. 检查菜单表是否已有数据
    const [menuCount] = await queryRunner.query('SELECT COUNT(*) as count FROM menus');

    if (menuCount && menuCount.count > 0) {
      console.log('菜单数据已存在，跳过初始化');
      return;
    }

    console.log('开始创建菜单数据...');

    // 3. 创建基础菜单数据
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

    // 系统管理
    const [systemResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['系统管理', '/system', 'Layout', 'system', 1, 0, 0, null, 0, now, now],
    );
    const systemId = systemResult.insertId;

    // 用户管理
    const [userResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '用户管理',
        'user',
        'system/user/index',
        'user',
        1,
        systemId,
        0,
        'system:user:list',
        1,
        now,
        now,
      ],
    );
    const userId = userResult.insertId;

    // 角色管理
    const [roleResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '角色管理',
        'role',
        'system/role/index',
        'role',
        2,
        systemId,
        0,
        'system:role:list',
        1,
        now,
        now,
      ],
    );
    const roleId = roleResult.insertId;

    // 菜单管理
    const [menuResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '菜单管理',
        'menu',
        'system/menu/index',
        'menu',
        3,
        systemId,
        0,
        'system:menu:list',
        1,
        now,
        now,
      ],
    );
    const menuId = menuResult.insertId;

    // 内容管理
    const [contentResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['内容管理', '/content', 'Layout', 'content', 2, 0, 0, null, 0, now, now],
    );
    const contentId = contentResult.insertId;

    // 文章管理
    const [articleResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '文章管理',
        'article',
        'content/article/index',
        'article',
        1,
        contentId,
        0,
        'content:article:list',
        1,
        now,
        now,
      ],
    );

    // 分类管理
    const [categoryResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '分类管理',
        'category',
        'content/category/index',
        'category',
        2,
        contentId,
        0,
        'content:category:list',
        1,
        now,
        now,
      ],
    );

    // 标签管理
    const [tagResult] = await queryRunner.query(
      `INSERT INTO menus (
        menu_name, path, component, icon, order_num, 
        parent_id, is_hidden, permission, type, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        '标签管理',
        'tag',
        'content/tag/index',
        'tag',
        3,
        contentId,
        0,
        'content:tag:list',
        1,
        now,
        now,
      ],
    );

    // 获取所有菜单ID用于分配给管理员角色
    const [allMenus] = await queryRunner.query('SELECT id FROM menus');
    const menuIds = allMenus.map((menu) => menu.id);

    // 4. 为管理员角色分配所有菜单权限
    console.log('为管理员角色分配菜单权限...');

    // 批量插入角色-菜单关联数据
    for (const menuId of menuIds) {
      await queryRunner.query(
        'INSERT INTO role_menus (role_id, menu_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [adminRoleId, menuId, now, now],
      );
    }

    console.log('菜单数据初始化完成!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 清空菜单和角色-菜单关联数据
    await queryRunner.query('DELETE FROM role_menus');
    await queryRunner.query('DELETE FROM menus');
    console.log('菜单数据已清空');
  }
}
