/**
 * 统一数据库管理工具
 *
 * 支持功能:
 * 1. 数据库表结构同步与初始化
 * 2. 基础数据初始化
 * 3. 菜单数据管理
 * 4. 用户账号管理
 */

import { DataSource, Repository } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';
import { RowDataPacket } from 'mysql2';

// 加载环境变量
function loadEnv() {
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envFile)) {
      console.log(`加载环境变量文件: ${envFile}`);
      dotenv.config({ path: envFile });
    } else {
      console.log('未找到.env文件，将使用默认配置');
      dotenv.config();
    }
  } catch (error) {
    console.warn('加载环境变量时出错，将使用默认配置:', error.message);
  }
}

// 数据库配置
function getDbConfig() {
  return {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'blog',
  };
}

// 为MySQL结果定义类型
interface UserRow extends RowDataPacket {
  id: number;
  username: string;
  password: string;
  nickname?: string;
  email?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface RoleRow extends RowDataPacket {
  id: number;
  role_label: string;
  roleName?: string;
}

/**
 * 查找所有实体文件
 */
function findEntityFiles(srcPath: string = path.join(__dirname, '../../')): string[] {
  const entityFiles = [];

  function scanDir(dirPath: string) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDir(filePath);
      } else if (file.endsWith('.entity.ts') || file.endsWith('.entity.js')) {
        entityFiles.push(filePath);
      }
    }
  }

  try {
    scanDir(srcPath);
    console.log(`找到 ${entityFiles.length} 个实体文件`);
    return entityFiles;
  } catch (error) {
    console.error('查找实体文件时出错:', error);
    return [];
  }
}

/**
 * 创建数据源连接
 */
function createDataSource(withSync: boolean = false): DataSource {
  const dbConfig = getDbConfig();
  const entityFiles = findEntityFiles();

  return new DataSource({
    type: 'mysql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities:
      entityFiles.length > 0 ? entityFiles : [path.join(__dirname, '../../**/*.entity{.ts,.js}')],
    synchronize: withSync, // 是否自动同步表结构
    logging: true,
  });
}

/**
 * 同步数据库表结构
 */
async function syncDatabase(): Promise<void> {
  loadEnv();
  const dbConfig = getDbConfig();

  try {
    console.log('数据库配置信息:');
    console.log(`- 主机: ${dbConfig.host}`);
    console.log(`- 端口: ${dbConfig.port}`);
    console.log(`- 数据库: ${dbConfig.database}`);

    console.log('\n正在连接数据库...');
    const dataSource = createDataSource(true); // 启用同步
    await dataSource.initialize();
    console.log('数据库连接成功!');

    console.log('\n正在同步数据库表结构...');
    console.log('\n警告：此操作可能导致数据丢失，请确保已经备份数据库!');
    console.log('数据库表结构同步进行中...');

    // 等待同步完成
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('数据库表结构同步已完成!');
  } catch (error) {
    console.error('同步数据库时出错:', error);
    handleDbError(error);
    throw error;
  }
}

/**
 * 修复数据库表结构
 */
async function fixDatabase(): Promise<void> {
  loadEnv();
  const dbConfig = getDbConfig();

  try {
    console.log('数据库配置信息:');
    console.log(`- 主机: ${dbConfig.host}`);
    console.log(`- 端口: ${dbConfig.port}`);
    console.log(`- 数据库: ${dbConfig.database}`);

    console.log('\n正在连接数据库...');
    const dataSource = createDataSource(false); // 不启用同步
    await dataSource.initialize();
    console.log('数据库连接成功!');

    // 获取查询器
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      // 开始事务
      await queryRunner.startTransaction();

      console.log('\n开始修复数据库...');

      // 1. 检查并创建数据库
      await queryRunner.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
      console.log(`确保数据库 ${dbConfig.database} 存在`);

      // 2. 确保表存在
      const createTables = [
        `CREATE TABLE IF NOT EXISTS t_role (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          roleName varchar(50) NOT NULL,
          role_label varchar(50) NOT NULL,
          remark text,
          PRIMARY KEY (id),
          UNIQUE KEY UK_role_label (role_label)
        )`,
        `CREATE TABLE IF NOT EXISTS t_menu (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          name varchar(50) NOT NULL,
          path varchar(100) NOT NULL,
          component varchar(100) DEFAULT NULL,
          icon varchar(50) DEFAULT NULL,
          parent_id int DEFAULT '0',
          order_num int DEFAULT '1',
          hidden tinyint(1) DEFAULT '0',
          perms varchar(100) DEFAULT NULL,
          redirect varchar(100) DEFAULT NULL,
          always_show tinyint(1) DEFAULT '0',
          type int DEFAULT '1',
          PRIMARY KEY (id)
        )`,
        `CREATE TABLE IF NOT EXISTS t_role_menu (
          role_id int NOT NULL,
          menu_id int NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (role_id,menu_id)
        )`,
        `CREATE TABLE IF NOT EXISTS t_user (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          nickname varchar(50) DEFAULT NULL,
          username varchar(50) NOT NULL,
          password varchar(100) NOT NULL,
          avatar varchar(255) DEFAULT NULL,
          web_site varchar(255) DEFAULT NULL,
          intro varchar(255) DEFAULT NULL,
          email varchar(50) DEFAULT NULL,
          ip_address varchar(50) DEFAULT NULL,
          ip_source varchar(50) DEFAULT NULL,
          login_type tinyint DEFAULT '0',
          is_disable tinyint(1) DEFAULT '0',
          login_time datetime DEFAULT NULL,
          status tinyint DEFAULT '1',
          PRIMARY KEY (id),
          UNIQUE KEY UK_username (username)
        )`,
        `CREATE TABLE IF NOT EXISTS t_user_role (
          user_id int NOT NULL,
          role_id int NOT NULL,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id,role_id)
        )`,
        `CREATE TABLE IF NOT EXISTS t_site_config (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          config_name varchar(50) NOT NULL,
          config_value text,
          remark varchar(255) DEFAULT NULL,
          is_frontend tinyint(1) DEFAULT '0',
          PRIMARY KEY (id),
          UNIQUE KEY UK_config_name (config_name)
        )`,
        `CREATE TABLE IF NOT EXISTS t_visit_log (
          id int NOT NULL AUTO_INCREMENT,
          created_at timestamp NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          page_url varchar(255) DEFAULT NULL,
          ip_address varchar(50) NOT NULL,
          ip_source varchar(255) DEFAULT NULL,
          os varchar(50) DEFAULT NULL,
          browser varchar(50) DEFAULT NULL,
          referer varchar(255) DEFAULT NULL,
          user_id int DEFAULT NULL,
          PRIMARY KEY (id)
        )`,
      ];

      for (const sql of createTables) {
        await queryRunner.query(sql);
      }
      console.log('基础表结构创建完成');

      // 3. 修复role_menu表的主键问题
      try {
        // 检查主键结构
        const roleMenuPK = await queryRunner.query(`
          SELECT COLUMN_NAME
          FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
          WHERE TABLE_SCHEMA = '${dbConfig.database}'
            AND TABLE_NAME = 't_role_menu'
            AND CONSTRAINT_NAME = 'PRIMARY'
          ORDER BY ORDINAL_POSITION`);

        // 如果主键不是(role_id, menu_id)组合主键，修复
        if (
          roleMenuPK.length !== 2 ||
          !(
            (roleMenuPK[0].COLUMN_NAME === 'role_id' && roleMenuPK[1].COLUMN_NAME === 'menu_id') ||
            (roleMenuPK[0].COLUMN_NAME === 'menu_id' && roleMenuPK[1].COLUMN_NAME === 'role_id')
          )
        ) {
          // 尝试删除现有主键
          try {
            await queryRunner.query('ALTER TABLE t_role_menu DROP PRIMARY KEY');
            console.log('删除t_role_menu现有主键');
          } catch (e) {
            console.log('t_role_menu没有主键或无法删除:', e.message);
          }

          // 添加新的复合主键
          await queryRunner.query('ALTER TABLE t_role_menu ADD PRIMARY KEY (role_id, menu_id)');
          console.log('设置t_role_menu表的复合主键(role_id, menu_id)');
        } else {
          console.log('t_role_menu表主键正常');
        }
      } catch (e) {
        console.error('修复t_role_menu表主键时出错:', e);
      }

      // 提交事务
      await queryRunner.commitTransaction();
      console.log('\n数据库结构修复完成!');
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      console.error('修复数据库时出错:', error);
      throw error;
    } finally {
      // 释放查询器
      await queryRunner.release();

      // 关闭数据库连接
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('数据库连接已关闭');
      }
    }
  } catch (error) {
    console.error('修复数据库失败:', error);
    handleDbError(error);
    throw error;
  }
}

/**
 * 初始化基础数据（角色、用户、网站配置等）
 */
async function initializeData(): Promise<void> {
  loadEnv();
  const dbConfig = getDbConfig();

  try {
    console.log('\n正在连接数据库...');
    const dataSource = createDataSource(false); // 不启用同步
    await dataSource.initialize();
    console.log('数据库连接成功!');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      console.log('===== 开始初始化基础数据 =====');

      // 1. 检查并创建管理员角色
      const roleTableExists = await queryRunner.hasTable('t_role');
      if (roleTableExists) {
        console.log('检查管理员角色...');
        const roleRepo = dataSource.getRepository('t_role');
        const adminRole = await roleRepo.findOne({ where: { role_label: 'admin' } });

        if (!adminRole) {
          console.log('创建管理员角色...');
          const now = new Date();
          const role = roleRepo.create({
            roleName: '管理员',
            role_label: 'admin',
            remark: '系统管理员，拥有所有权限',
            createdAt: now,
            updatedAt: now,
          });
          const savedRole = await roleRepo.save(role);
          console.log('管理员角色创建成功!');
        } else {
          console.log('管理员角色已存在!');
        }

        // 2. 检查并创建管理员用户
        const userRepo = dataSource.getRepository('t_user');
        const adminUser = await userRepo.findOne({ where: { username: 'admin' } });

        if (!adminUser) {
          console.log('创建管理员用户...');

          // 创建密码hash - 123123
          const salt = await bcrypt.genSalt();
          const passwordHash = await bcrypt.hash('123123', salt);

          const now = new Date();
          const user = userRepo.create({
            username: 'admin',
            nickname: '管理员',
            password: passwordHash,
            avatar: 'https://example.com/default-avatar.png',
            email: 'admin@example.com',
            createdAt: now,
            updatedAt: now,
          });

          const savedUser = await userRepo.save(user);
          console.log('管理员用户创建成功!');

          // 3. 分配角色给用户
          const role = await roleRepo.findOne({ where: { role_label: 'admin' } });
          if (role) {
            const userRoleRepo = dataSource.getRepository('t_user_role');
            const now = new Date();
            const userRole = userRoleRepo.create({
              userId: savedUser.id,
              roleId: role.id,
              createdAt: now,
              updatedAt: now,
            });
            await userRoleRepo.save(userRole);
            console.log('角色分配成功!');
          }
        } else {
          console.log('管理员用户已存在，更新密码...');

          // 更新密码为123123
          const salt = await bcrypt.genSalt();
          const passwordHash = await bcrypt.hash('123123', salt);

          adminUser.password = passwordHash;
          await userRepo.save(adminUser);
          console.log('管理员密码已更新为: 123123');
        }

        // 4. 检查并创建基础站点配置
        const configRepo = dataSource.getRepository('t_site_config');
        const configCount = await configRepo.count();

        if (configCount === 0) {
          console.log('创建基础站点配置...');
          const now = new Date();
          const configs = [
            {
              configName: 'website.name',
              configValue: 'Conder Blog',
              remark: '网站名称',
              isFrontend: 1,
            },
            {
              configName: 'website.description',
              configValue: '个人博客系统',
              remark: '网站描述',
              isFrontend: 1,
            },
            {
              configName: 'website.logo',
              configValue: 'https://example.com/logo.png',
              remark: '网站Logo',
              isFrontend: 1,
            },
            {
              configName: 'website.notice',
              configValue: '欢迎来到我的博客',
              remark: '网站公告',
              isFrontend: 1,
            },
            { configName: 'website.recordNo', configValue: '', remark: '备案号', isFrontend: 1 },
            {
              configName: 'website.createTime',
              configValue: '2024-01-01',
              remark: '网站创建时间',
              isFrontend: 1,
            },
            {
              configName: 'about.content',
              configValue: '# 关于我\n\n这是一个使用Nest.js构建的个人博客系统。',
              remark: '关于我页面内容',
              isFrontend: 1,
            },
          ];

          for (const config of configs) {
            const configEntity = configRepo.create({
              configName: config.configName,
              configValue: config.configValue,
              remark: config.remark,
              isFrontend: config.isFrontend,
              createdAt: now,
              updatedAt: now,
            });
            await configRepo.save(configEntity);
          }
          console.log('站点配置创建成功!');
        } else {
          console.log('站点配置已存在!');
        }
      }

      await queryRunner.commitTransaction();
      console.log('基础数据初始化完成!');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('数据初始化失败:', error);
      throw error;
    } finally {
      await queryRunner.release();

      // 关闭数据库连接
      if (dataSource.isInitialized) {
        await dataSource.destroy();
        console.log('数据库连接已关闭');
      }
    }
  } catch (error) {
    console.error('数据初始化失败:', error);
    handleDbError(error);
    throw error;
  }
}

/**
 * 初始化菜单数据
 */
async function initializeMenus(): Promise<void> {
  loadEnv();
  const dbConfig = getDbConfig();

  try {
    // 直接使用mysql2连接
    console.log('尝试连接到MySQL...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });

    console.log('MySQL连接成功!');

    try {
      // 先检查管理员角色
      const [roleRows] = await connection.execute('SELECT * FROM t_role WHERE role_label = ?', [
        'admin',
      ]);

      // @ts-expect-error - 忽略类型检查，roleRows是一个数组
      if (roleRows.length === 0 || roleRows.length === undefined) {
        console.log('未找到管理员角色，请先运行初始化数据功能创建角色');
        return;
      }

      const adminRoleId = roleRows[0]['id'];
      console.log('找到管理员角色，ID:', adminRoleId);

      // 清空现有菜单和角色菜单关系
      console.log('清空现有菜单数据...');
      await connection.execute('DELETE FROM t_role_menu');
      await connection.execute('DELETE FROM t_menu');
      console.log('现有菜单数据已清空');

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
          icon: 'system',
          hidden: 0,
          redirect: 'noRedirect',
          alwaysShow: 1,
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
          icon: 'document',
          hidden: 0,
          redirect: 'noRedirect',
          alwaysShow: 1,
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
          icon: 'monitor',
          hidden: 0,
          redirect: 'noRedirect',
          alwaysShow: 1,
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
            menu.icon,
            menu.order_num,
            menu.parent_id,
            menu.hidden,
            menu.type,
            menu.perms,
            menu.redirect,
            menu.alwaysShow,
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
        console.log(`创建子菜单: ${menu.name}, ID: ${menuId}`);
      }

      // 为管理员角色分配所有菜单权限
      console.log('为管理员角色分配菜单权限...');
      for (const menuId of menuIds) {
        await connection.execute(
          'INSERT INTO t_role_menu (role_id, menu_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
          [adminRoleId, menuId, now, now],
        );
      }

      console.log(`菜单数据初始化完成，共创建菜单: ${menuIds.length}`);
    } catch (err) {
      console.error('数据库操作错误:', err);
      throw err;
    } finally {
      // 关闭数据库连接
      await connection.end();
    }
  } catch (error) {
    console.error('初始化菜单数据时出错:', error);
    throw error;
  }
}

/**
 * 修复管理员用户密码 - admin:123123
 */
async function fixAdminPassword(): Promise<void> {
  loadEnv();
  const dbConfig = getDbConfig();

  try {
    console.log('开始修复管理员用户和密码...');

    // 直接使用mysql2连接
    console.log('尝试连接到MySQL...');
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.username,
      password: dbConfig.password,
      database: dbConfig.database,
    });

    console.log('MySQL连接成功!');

    try {
      // 获取管理员用户
      const [users] = await connection.execute<UserRow[]>(
        'SELECT * FROM t_user WHERE username = ?',
        ['admin'],
      );

      // bcrypt生成的密码哈希 - "123123"
      const passwordHash = '$2b$10$hIMx4J5bMjgVn3D8HJTQFOyjhWJmhFLjE0aRH5FXbZDXcJeBP54gG';

      // 判断users数组是否为空
      if (Array.isArray(users) && users.length === 0) {
        console.log('未找到管理员用户，创建新用户...');

        // 创建管理员用户
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO t_user (username, nickname, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          ['admin', '系统管理员', passwordHash, 'admin@example.com', now, now],
        );
        console.log('管理员用户创建成功!');

        // 获取新创建的用户
        const [newUsers] = await connection.execute<UserRow[]>(
          'SELECT id FROM t_user WHERE username = ?',
          ['admin'],
        );

        // 获取管理员角色
        const [roles] = await connection.execute<RoleRow[]>(
          'SELECT id FROM t_role WHERE role_label = ?',
          ['admin'],
        );

        if (roles.length > 0 && newUsers.length > 0) {
          const roleId = roles[0].id;
          const userId = newUsers[0].id;

          // 添加用户角色关联
          await connection.execute(
            'INSERT INTO t_user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
            [userId, roleId, now, now],
          );
          console.log('已为新用户分配管理员角色');
        }
      } else {
        console.log('找到管理员用户，更新密码...');

        // 更新管理员密码
        await connection.execute('UPDATE t_user SET password = ? WHERE username = ?', [
          passwordHash,
          'admin',
        ]);
        console.log('管理员密码更新成功!');
      }

      // 验证管理员密码已更新
      const [userResults] = await connection.execute<UserRow[]>(
        'SELECT id, username, password FROM t_user WHERE username = ?',
        ['admin'],
      );

      if (userResults.length > 0) {
        const user = userResults[0];
        console.log(`管理员ID: ${user.id}, 密码哈希长度: ${user.password?.length || 0}`);
      }

      console.log('管理员账号信息：');
      console.log('- 用户名: admin');
      console.log('- 密码: 123123');
    } catch (err) {
      console.error('数据库操作错误:', err);
      throw err;
    } finally {
      // 关闭数据库连接
      await connection.end();
    }
  } catch (error) {
    console.error('修复管理员密码时出错:', error);
    throw error;
  }
}

/**
 * 处理数据库错误
 */
function handleDbError(error: any): void {
  if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('错误: 数据库访问被拒绝。请检查用户名和密码设置。');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('错误: 无法连接到数据库服务器。请检查主机和端口设置，并确保MySQL服务正在运行。');
  }
}

/**
 * 命令行入口
 */
async function main() {
  // 加载环境变量
  loadEnv();

  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
      case 'sync':
        // 同步数据库表结构
        console.log('执行数据库同步...');
        await syncDatabase();
        console.log('数据库同步完成');
        break;

      case 'fix':
        // 修复数据库表结构
        console.log('执行数据库修复...');
        await fixDatabase();
        console.log('数据库修复完成');
        break;

      case 'init':
        // 初始化基础数据
        console.log('执行数据初始化...');
        await initializeData();
        console.log('数据初始化完成');
        break;

      case 'menus':
        // 初始化菜单数据
        console.log('执行菜单初始化...');
        await initializeMenus();
        console.log('菜单初始化完成');
        break;

      case 'admin':
        // 修复管理员密码
        console.log('执行管理员账号修复...');
        await fixAdminPassword();
        console.log('管理员账号修复完成');
        break;

      case 'all':
        // 执行所有操作
        console.log('执行完整数据库初始化流程...');
        await fixDatabase();
        await initializeData();
        await initializeMenus();
        await fixAdminPassword();
        console.log('完整数据库初始化流程完成');
        break;

      default:
        console.log('==== 统一数据库管理工具 ====');
        console.log('可用命令:');
        console.log('  sync  - 同步数据库表结构');
        console.log('  fix   - 修复数据库表结构');
        console.log('  init  - 初始化基础数据');
        console.log('  menus - 初始化菜单数据');
        console.log('  admin - 修复管理员密码');
        console.log('  all   - 执行所有操作');
        console.log('\n用法: npm run db [命令]');
    }
  } catch (error) {
    console.error('执行命令失败:', error);
    process.exit(1);
  }
}

// 执行主程序
main().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
