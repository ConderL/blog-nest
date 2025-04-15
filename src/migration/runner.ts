/**
 * 数据库迁移运行器
 * 提供统一的接口来运行初始化数据库的迁移脚本
 */

import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { UpdateVisitLog1718444400000 } from './1718444400000-UpdateVisitLog';
import { InitializeMigrateData1718500000000 } from './InitializeMigrateData';
import { InitializeMenuData1718500001000 } from './InitializeMenuData';
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

// 创建迁移所需的数据源连接
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
  synchronize: false,
  logging: true,
});

// 异常处理函数
function handleError(error: any, message: string) {
  console.error(`${message}:`, error);

  if (error.code === 'ER_NO_SUCH_TABLE') {
    console.error('错误: 表不存在。请确保数据库表已创建。您可能需要先运行同步命令来创建表结构。');
  } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
    console.error('错误: 数据库访问被拒绝。请检查用户名和密码设置。');
  } else if (error.code === 'ECONNREFUSED') {
    console.error('错误: 无法连接到数据库服务器。请检查主机和端口设置，并确保MySQL服务正在运行。');
  }
}

/**
 * 运行数据库初始化和迁移
 */
async function runMigrations() {
  try {
    console.log('数据库配置信息:');
    // 使用类型断言解决TypeScript错误
    const options = dataSource.options as any;
    console.log(`- 主机: ${options.host}`);
    console.log(`- 端口: ${options.port}`);
    console.log(`- 数据库: ${dataSource.options.database}`);

    console.log('\n正在连接数据库...');
    await dataSource.initialize();
    console.log('数据库连接成功!');

    console.log('\n开始执行迁移...');

    try {
      // 1. 修复访问日志表结构
      const updateVisitLog = new UpdateVisitLog1718444400000();
      console.log('1. 执行: 修复访问日志表结构');
      await updateVisitLog.up(dataSource.createQueryRunner());
      console.log('✓ 访问日志表结构修复完成');
    } catch (error) {
      handleError(error, '执行访问日志表修复时出错');
    }

    try {
      // 2. 初始化基础数据
      const initializeMigrateData = new InitializeMigrateData1718500000000();
      console.log('\n2. 执行: 初始化基础数据');
      await initializeMigrateData.up(dataSource.createQueryRunner());
      console.log('✓ 基础数据初始化完成');
    } catch (error) {
      handleError(error, '执行基础数据初始化时出错');
    }

    try {
      // 3. 初始化菜单数据
      const initializeMenuData = new InitializeMenuData1718500001000();
      console.log('\n3. 执行: 初始化菜单数据');
      await initializeMenuData.up(dataSource.createQueryRunner());
      console.log('✓ 菜单数据初始化完成');
    } catch (error) {
      handleError(error, '执行菜单数据初始化时出错');
    }

    console.log('\n所有迁移执行完成!');
  } catch (error) {
    handleError(error, '执行迁移时出错');
    process.exit(1);
  } finally {
    // 关闭数据库连接
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行迁移
runMigrations()
  .then(() => {
    console.log('数据库初始化处理完成!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库初始化失败:', error);
    process.exit(1);
  });
