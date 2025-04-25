import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as mysql from 'mysql2/promise';

// 加载环境变量
try {
  const envFile = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
  } else {
    dotenv.config();
  }
} catch (error) {
  console.warn('加载环境变量时出错，将使用默认配置:', error.message);
}

// 确保数据库存在
async function ensureDatabaseExists() {
  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const username = process.env.DB_USERNAME || 'root';
  const password = process.env.DB_PASSWORD || 'root';
  const database = process.env.DB_DATABASE || 'blog';

  try {
    console.log(`正在检查数据库 ${database} 是否存在...`);

    // 创建数据库连接（不指定数据库名称）
    const connection = await mysql.createConnection({
      host,
      port,
      user: username,
      password,
    });

    // 创建数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` 
                          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);

    console.log(`已成功创建/确认数据库 ${database} 存在`);

    // 关闭连接
    await connection.end();
  } catch (error) {
    console.error(`创建数据库时出错: ${error.message}`);
  }
}

// 先确保数据库存在
ensureDatabaseExists();

// 创建数据源配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/database/migrations/*{.ts,.js}'],
  synchronize: true, // 保持与app.module.ts一致
  logging: process.env.NODE_ENV !== 'production',
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
});

export default dataSource;
