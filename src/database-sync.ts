/**
 * 数据库表结构同步工具
 *
 * 警告：此脚本会根据实体定义同步数据库结构，可能导致数据丢失
 * 仅用于开发环境或初始化数据库
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

// 查找所有实体文件
const entityFiles = [];
const srcPath = path.join(__dirname);

// 递归查找所有.entity.ts或.entity.js文件
function findEntityFiles(dirPath: string) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findEntityFiles(filePath);
    } else if (file.endsWith('.entity.ts') || file.endsWith('.entity.js')) {
      entityFiles.push(filePath);
    }
  }
}

try {
  findEntityFiles(srcPath);
  console.log(`找到 ${entityFiles.length} 个实体文件`);
} catch (error) {
  console.error('查找实体文件时出错:', error);
  process.exit(1);
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
  entities: entityFiles.length > 0 ? entityFiles : [__dirname + '/**/*.entity{.ts,.js}'],
  synchronize: true, // 启用同步
  logging: true,
});

async function syncDatabase() {
  try {
    console.log('数据库配置信息:');
    console.log(`- 主机: ${dbConfig.host}`);
    console.log(`- 端口: ${dbConfig.port}`);
    console.log(`- 数据库: ${dbConfig.database}`);
    console.log(`- 实体文件: ${entityFiles.length} 个`);

    console.log('\n正在连接数据库...');
    await dataSource.initialize();
    console.log('数据库连接成功!');

    console.log('\n正在同步数据库表结构...');
    console.log('\n警告：此操作可能导致数据丢失，请确保已经备份数据库!');
    console.log('数据库表结构同步进行中...');

    // 等待同步完成
    await new Promise((resolve) => setTimeout(resolve, 5000));

    console.log('数据库表结构同步已完成!');

    console.log('\n现在您可以运行以下命令来初始化基础数据:');
    console.log('npm run db:init');
  } catch (error) {
    console.error('同步数据库时出错:', error);

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

// 运行同步
syncDatabase()
  .then(() => {
    console.log('数据库表结构同步完成!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库表结构同步失败:', error);
    process.exit(1);
  });
