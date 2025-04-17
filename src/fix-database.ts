/**
 * 数据库修复工具
 *
 * 修复数据库表结构和数据初始化问题
 */

import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
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

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
};

// 创建数据源连接
const dataSource = new DataSource({
  type: 'mysql',
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.username,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: false, // 不自动同步
  logging: true,
});

/**
 * 修复数据库表结构
 */
async function fixDatabase() {
  try {
    console.log('数据库配置信息:');
    console.log(`- 主机: ${dbConfig.host}`);
    console.log(`- 端口: ${dbConfig.port}`);
    console.log(`- 数据库: ${dbConfig.database}`);

    console.log('\n正在连接数据库...');
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
          menu_name varchar(50) NOT NULL,
          path varchar(100) NOT NULL,
          component varchar(100) DEFAULT NULL,
          icon varchar(50) DEFAULT NULL,
          parent_id int DEFAULT '0',
          order_num int DEFAULT '1',
          is_hidden tinyint(1) DEFAULT '0',
          permission varchar(100) DEFAULT NULL,
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

      // 4. 修复visit_log表问题
      try {
        // 检查visit_log表
        const visitLogExists = await queryRunner.query(`
          SHOW TABLES LIKE 'visit_log'
        `);

        const tVisitLogExists = await queryRunner.query(`
          SHOW TABLES LIKE 't_visit_log'
        `);

        // 删除可能存在的冲突表
        if (visitLogExists.length > 0) {
          await queryRunner.query('DROP TABLE IF EXISTS visit_log');
          console.log('删除冲突表visit_log');
        }

        // 确保t_visit_log表存在
        if (tVisitLogExists.length === 0) {
          await queryRunner.query(`
            CREATE TABLE t_visit_log (
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
            )
          `);
          console.log('创建t_visit_log表');
        } else {
          console.log('t_visit_log表已存在');
        }
      } catch (e) {
        console.error('修复访问日志表时出错:', e);
      }

      // 提交事务
      await queryRunner.commitTransaction();
      console.log('\n数据库修复完成!');
    } catch (error) {
      // 回滚事务
      await queryRunner.rollbackTransaction();
      console.error('修复数据库时出错:', error);
      throw error;
    } finally {
      // 释放查询器
      await queryRunner.release();
    }

    console.log('\n现在您可以运行以下命令来进行数据初始化:');
    console.log('npm run db:init');
  } catch (error) {
    console.error('修复数据库失败:', error);

    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('错误: 数据库访问被拒绝。请检查用户名和密码设置。');
    } else if (error.code === 'ECONNREFUSED') {
      console.error(
        '错误: 无法连接到数据库服务器。请检查主机和端口设置，并确保MySQL服务正在运行。',
      );
    }

    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 运行修复
fixDatabase()
  .then(() => {
    console.log('数据库修复完成!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库修复失败:', error);
    process.exit(1);
  });
