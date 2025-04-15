import { createConnection } from 'typeorm';
import * as path from 'path';
import * as mysql from 'mysql2/promise';

async function main() {
  console.log('开始修复数据库...');

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

    let adminRoleId = null; // 将变量声明提前

    try {
      // 先检查表是否存在
      const [tables] = await connection.execute("SHOW TABLES LIKE 't_role'");
      // @ts-ignore
      if (tables.length === 0) {
        console.log('创建角色表...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS t_role (
            id int NOT NULL AUTO_INCREMENT,
            roleName varchar(50) NOT NULL,
            role_label varchar(50) NOT NULL UNIQUE,
            remark text,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('角色表创建成功');
      }

      // 创建用户表
      const [userTables] = await connection.execute("SHOW TABLES LIKE 't_user'");
      // @ts-ignore
      if (userTables.length === 0) {
        console.log('创建用户表...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS t_user (
            id int NOT NULL AUTO_INCREMENT,
            username varchar(50) NOT NULL,
            nickname varchar(50) NOT NULL,
            password varchar(100) NOT NULL,
            email varchar(100),
            avatar varchar(255),
            web_site varchar(255),
            intro text,
            ip_address varchar(50),
            ip_source varchar(50),
            login_type int DEFAULT 1,
            is_disable int DEFAULT 0,
            login_time timestamp NULL,
            status int DEFAULT 1,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('用户表创建成功');

        // 创建管理员用户
        console.log('创建管理员用户...');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await connection.execute(
          'INSERT INTO t_user (username, nickname, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            'admin',
            '系统管理员',
            '$2a$10$skTc5Qtf8TG.mQbWINu3d.0XQPQd9wDJUWWi.6hHbHXs.Hm7jSKqq',
            'admin@example.com',
            now,
            now,
          ],
        );
        console.log('管理员用户创建成功');
      }

      // 创建用户角色关联表
      const [userRoleTables] = await connection.execute("SHOW TABLES LIKE 't_user_role'");
      // @ts-ignore
      if (userRoleTables.length === 0) {
        console.log('创建用户角色关联表...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS t_user_role (
            user_id int NOT NULL,
            role_id int NOT NULL,
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (user_id, role_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('用户角色关联表创建成功');
      }

      // 检查管理员角色是否存在
      const [roleRows] = await connection.execute('SELECT * FROM t_role WHERE role_label = ?', [
        'admin',
      ]);

      // @ts-ignore - 忽略类型检查，roleRows是一个数组
      if (roleRows.length === 0 || roleRows.length === undefined) {
        console.log('创建管理员角色...');
        // 创建管理员角色
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await connection.execute(
          'INSERT INTO t_role (roleName, role_label, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
          ['管理员', 'admin', '系统管理员，拥有所有权限', now, now],
        );
        // @ts-ignore
        adminRoleId = result.insertId;
        console.log('管理员角色创建成功，ID:', adminRoleId);
      } else {
        // @ts-ignore
        adminRoleId = roleRows[0].id;
        console.log('管理员角色已存在，ID:', adminRoleId);
      }

      // 获取第一个用户
      const [userRows] = await connection.execute('SELECT * FROM t_user ORDER BY id ASC LIMIT 1');

      // @ts-ignore - 忽略类型检查，userRows是一个数组
      if (userRows.length > 0) {
        // @ts-ignore
        const firstUser = userRows[0];
        console.log('找到用户:', firstUser.username);

        // 检查用户是否已有管理员角色
        const [userRoleRows] = await connection.execute(
          'SELECT * FROM t_user_role WHERE user_id = ? AND role_id = ?',
          [firstUser.id, adminRoleId],
        );

        // @ts-ignore - 忽略类型检查，userRoleRows是一个数组
        if (userRoleRows.length === 0) {
          // 分配管理员角色给用户
          const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
          await connection.execute(
            'INSERT INTO t_user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [firstUser.id, adminRoleId, now, now],
          );
          console.log('管理员角色已分配给用户:', firstUser.username);
        } else {
          console.log('用户已拥有管理员角色');
        }
      } else {
        console.log('未找到任何用户');

        // 创建管理员用户
        console.log('创建管理员用户...');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        const [result] = await connection.execute(
          'INSERT INTO t_user (username, nickname, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            'admin',
            '系统管理员',
            '$2a$10$skTc5Qtf8TG.mQbWINu3d.0XQPQd9wDJUWWi.6hHbHXs.Hm7jSKqq',
            'admin@example.com',
            now,
            now,
          ],
        );

        // @ts-ignore
        const userId = result.insertId;
        console.log('管理员用户创建成功，ID:', userId);

        // 分配管理员角色给新创建的用户
        await connection.execute(
          'INSERT INTO t_user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [userId, adminRoleId, now, now],
        );
        console.log('管理员角色已分配给新创建的用户');
      }

      // 创建菜单表
      const [menuTables] = await connection.execute("SHOW TABLES LIKE 't_menu'");
      // @ts-ignore - 忽略类型检查，menuTables是一个数组
      if (menuTables.length === 0 || menuTables.length === undefined) {
        console.log('创建菜单表...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS t_menu (
            id int NOT NULL AUTO_INCREMENT,
            name varchar(50) NOT NULL,
            path varchar(50) NOT NULL,
            component varchar(50),
            icon varchar(50),
            parent_id int DEFAULT 0,
            order_num int DEFAULT 1,
            hidden tinyint(1) DEFAULT 0,
            type int DEFAULT 1,
            perms varchar(100),
            created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at timestamp NULL DEFAULT NULL,
            PRIMARY KEY (id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('菜单表创建成功');
      }

      // 创建角色菜单关联表
      const [roleMenuTables] = await connection.execute("SHOW TABLES LIKE 't_role_menu'");
      // @ts-ignore - 忽略类型检查，roleMenuTables是一个数组
      if (roleMenuTables.length === 0 || roleMenuTables.length === undefined) {
        console.log('创建角色菜单关联表...');
        await connection.execute(`
          CREATE TABLE IF NOT EXISTS t_role_menu (
            role_id int NOT NULL,
            menu_id int NOT NULL,
            PRIMARY KEY (role_id, menu_id)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('角色菜单关联表创建成功');
      }

      // 检查菜单表是否已有数据
      const [menuCount] = await connection.execute('SELECT COUNT(*) as count FROM t_menu');
      // @ts-ignore
      if (menuCount[0].count === 0) {
        console.log('开始创建菜单数据...');
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

        // 1. 系统管理
        const [systemResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['系统管理', '/system', 'Layout', 'system', 1, 0, 0, 0, null, now, now],
        );
        // @ts-ignore
        const systemId = systemResult.insertId;

        // 2. 用户管理
        const [userResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '用户管理',
            'user',
            'system/user/index',
            'user',
            1,
            systemId,
            0,
            1,
            'system:user:list',
            now,
            now,
          ],
        );
        // @ts-ignore
        const userId = userResult.insertId;

        // 3. 角色管理
        const [roleResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '角色管理',
            'role',
            'system/role/index',
            'role',
            2,
            systemId,
            0,
            1,
            'system:role:list',
            now,
            now,
          ],
        );
        // @ts-ignore
        const roleId = roleResult.insertId;

        // 4. 菜单管理
        const [menuResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '菜单管理',
            'menu',
            'system/menu/index',
            'menu',
            3,
            systemId,
            0,
            1,
            'system:menu:list',
            now,
            now,
          ],
        );
        // @ts-ignore
        const menuId = menuResult.insertId;

        // 5. 内容管理
        const [contentResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          ['内容管理', '/content', 'Layout', 'document', 2, 0, 0, 0, null, now, now],
        );
        // @ts-ignore
        const contentId = contentResult.insertId;

        // 6. 文章管理
        const [articleResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '文章管理',
            'article',
            'content/article/index',
            'article',
            1,
            contentId,
            0,
            1,
            'content:article:list',
            now,
            now,
          ],
        );

        // 7. 分类管理
        const [categoryResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '分类管理',
            'category',
            'content/category/index',
            'category',
            2,
            contentId,
            0,
            1,
            'content:category:list',
            now,
            now,
          ],
        );

        // 8. 标签管理
        const [tagResult] = await connection.execute(
          `INSERT INTO t_menu (name, path, component, icon, order_num, parent_id, hidden, type, perms, created_at, updated_at) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            '标签管理',
            'tag',
            'content/tag/index',
            'tag',
            3,
            contentId,
            0,
            1,
            'content:tag:list',
            now,
            now,
          ],
        );

        // 获取所有菜单ID
        const [allMenus] = await connection.execute('SELECT id FROM t_menu');

        // 为管理员角色分配所有菜单权限
        console.log('为管理员角色分配菜单权限...');
        // @ts-ignore - 忽略类型检查，遍历allMenus
        for (let i = 0; i < allMenus.length; i++) {
          // @ts-ignore
          const menuId = allMenus[i].id;
          await connection.execute('INSERT INTO t_role_menu (role_id, menu_id) VALUES (?, ?)', [
            adminRoleId,
            menuId,
          ]);
        }

        // @ts-ignore - 忽略类型检查，使用allMenus.length
        console.log('菜单数据初始化完成，共创建菜单:', allMenus ? allMenus.length : 0);
      } else {
        console.log('菜单数据已存在，跳过创建');
      }
    } catch (err) {
      console.error('数据库操作错误:', err);
    }

    // 关闭数据库连接
    await connection.end();
    console.log('数据库修复完成!');
  } catch (error) {
    console.error('修复数据库时出错:', error);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
