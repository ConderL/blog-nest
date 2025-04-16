import * as mysql from 'mysql2/promise';

async function main() {
  console.log('开始更新菜单数据...');

  try {
    // 直接使用mysql2连接
    console.log('尝试连接到MySQL...');
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'wdrx4100',
      database: 'blog',
    });

    console.log('MySQL连接成功!');

    try {
      // 清空现有菜单和角色菜单关系
      console.log('清空现有菜单数据...');
      await connection.execute('DELETE FROM t_role_menu');
      await connection.execute('DELETE FROM t_menu');
      console.log('现有菜单数据已清空');

      // 获取管理员角色
      const [roleRows] = await connection.execute('SELECT * FROM t_role WHERE role_label = ?', [
        'admin',
      ]);

      // @ts-expect-error - 忽略类型检查，roleRows是一个数组
      if (roleRows.length === 0 || roleRows.length === undefined) {
        console.log('未找到管理员角色，请先运行fix-database.ts创建角色');
        return;
      }

      const adminRoleId = roleRows[0]['id'];
      console.log('找到管理员角色，ID:', adminRoleId);

      // 先检查t_menu表中是否有redirect和alwaysShow字段
      try {
        const [columns] = await connection.execute('SHOW COLUMNS FROM t_menu');
        // @ts-expect-error - 忽略类型检查
        const columnNames = columns.map((column) => column.Field);

        // 如果没有redirect字段，添加它
        if (!columnNames.includes('redirect')) {
          console.log('添加redirect字段到t_menu表...');
          await connection.execute(
            'ALTER TABLE t_menu ADD COLUMN redirect varchar(50) DEFAULT NULL',
          );
        }

        // 如果没有alwaysShow字段，添加它
        if (!columnNames.includes('always_show')) {
          console.log('添加always_show字段到t_menu表...');
          await connection.execute(
            'ALTER TABLE t_menu ADD COLUMN always_show tinyint(1) DEFAULT 0',
          );
        }
      } catch (error) {
        console.error('检查表结构时出错:', error);
      }

      // 创建新的菜单数据
      console.log('开始创建菜单数据...');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 先插入所有父级菜单，并记录它们的ID
      const parentMenus = [
        // 1. 系统管理
        {
          name: '系统管理',
          path: 'system',
          component: 'Layout',
          meta: {
            title: '系统管理',
            icon: 'system',
            hidden: 0,
          },
          redirect: 'noRedirect',
          alwaysShow: true,
          order_num: 1,
          parent_id: 0,
          type: 0, // 目录
          perms: null,
        },
        // 2. 内容管理
        {
          name: '内容管理',
          path: 'blog',
          component: 'Layout',
          meta: {
            title: '内容管理',
            icon: 'document',
            hidden: 0,
          },
          redirect: 'noRedirect',
          alwaysShow: true,
          order_num: 2,
          parent_id: 0,
          type: 0, // 目录
          perms: null,
        },
        // 3. 系统监控
        {
          name: '系统监控',
          path: 'monitor',
          component: 'Layout',
          meta: {
            title: '系统监控',
            icon: 'monitor',
            hidden: 0,
          },
          redirect: 'noRedirect',
          alwaysShow: true,
          order_num: 3,
          parent_id: 0,
          type: 0, // 目录
          perms: null,
        },
      ];

      // 插入父菜单并记录ID
      const parentMenuIds = {};
      for (let i = 0; i < parentMenus.length; i++) {
        const menu = parentMenus[i];
        const [result] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, redirect, always_show, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            menu.name,
            menu.path,
            menu.component,
            menu.meta.icon,
            menu.order_num,
            menu.parent_id,
            menu.meta.hidden,
            menu.type,
            menu.perms,
            menu.redirect || null,
            menu.alwaysShow ? 1 : 0,
            now,
            now,
          ],
        );
        // @ts-expect-error - 忽略类型检查
        const menuId = result.insertId;
        parentMenuIds[i + 1] = menuId; // 保存父菜单ID，索引从1开始
        console.log(`创建父菜单: ${menu.name}, ID: ${menuId}`);
      }

      // 插入子菜单数据
      const childMenus = [
        // 用户管理 (系统管理子菜单)
        {
          name: '用户管理',
          path: 'user',
          component: 'system/user/index',
          icon: 'user',
          order_num: 1,
          parent_id: parentMenuIds[1], // 系统管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'system:user:list',
        },
        // 角色管理 (系统管理子菜单)
        {
          name: '角色管理',
          path: 'role',
          component: 'system/role/index',
          icon: 'role',
          order_num: 2,
          parent_id: parentMenuIds[1], // 系统管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'system:role:list',
        },
        // 菜单管理 (系统管理子菜单)
        {
          name: '菜单管理',
          path: 'menu',
          component: 'system/menu/index',
          icon: 'menu',
          order_num: 3,
          parent_id: parentMenuIds[1], // 系统管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'system:menu:list',
        },
        // 文章管理 (内容管理子菜单)
        {
          name: '文章管理',
          path: 'article/list',
          component: 'blog/article/list',
          icon: 'article',
          order_num: 1,
          parent_id: parentMenuIds[2], // 内容管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'content:article:list',
        },
        // 分类管理 (内容管理子菜单)
        {
          name: '分类管理',
          path: 'category',
          component: 'blog/category/index',
          icon: 'category',
          order_num: 2,
          parent_id: parentMenuIds[2], // 内容管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'content:category:list',
        },
        // 标签管理 (内容管理子菜单)
        {
          name: '标签管理',
          path: 'tag',
          component: 'blog/tag/index',
          icon: 'tag',
          order_num: 3,
          parent_id: parentMenuIds[2], // 内容管理
          hidden: 0,
          type: 1, // 菜单
          perms: 'content:tag:list',
        },
        // 在线用户 (系统监控子菜单)
        {
          name: '在线用户',
          path: 'online',
          component: 'monitor/online/index',
          icon: 'online',
          order_num: 1,
          parent_id: parentMenuIds[3], // 系统监控
          hidden: 0,
          type: 1, // 菜单
          perms: 'monitor:online:list',
        },
        // 操作日志 (系统监控子菜单)
        {
          name: '操作日志',
          path: 'log',
          component: 'monitor/log/index',
          icon: 'log',
          order_num: 2,
          parent_id: parentMenuIds[3], // 系统监控
          hidden: 0,
          type: 1, // 菜单
          perms: 'monitor:log:list',
        },
      ];

      // 插入子菜单
      const menuIds = [...Object.values(parentMenuIds)];
      for (const menu of childMenus) {
        const [result] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, redirect, always_show, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            menu.name,
            menu.path,
            menu.component,
            menu.icon,
            menu.order_num,
            menu.parent_id,
            menu.hidden,
            menu.type,
            menu.perms,
            null, // 子菜单不需要redirect
            0, // 子菜单不需要alwaysShow
            now,
            now,
          ],
        );
        // @ts-expect-error - 忽略类型检查
        const menuId = result.insertId;
        menuIds.push(menuId);
        console.log(`创建子菜单: ${menu.name}, ID: ${menuId}, 父菜单ID: ${menu.parent_id}`);
      }

      // 为管理员角色分配所有菜单权限
      console.log('为管理员角色分配菜单权限...');
      for (const menuId of menuIds) {
        await connection.execute('INSERT INTO t_role_menu (role_id, menu_id) VALUES (?, ?)', [
          adminRoleId,
          menuId,
        ]);
      }

      console.log(`菜单数据初始化完成，共创建菜单: ${menuIds.length}`);
    } catch (err) {
      console.error('数据库操作错误:', err);
    }

    // 关闭数据库连接
    await connection.end();
    console.log('菜单数据更新完成!');
  } catch (error) {
    console.error('更新菜单数据时出错:', error);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
