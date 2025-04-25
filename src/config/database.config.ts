import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import * as mysql from 'mysql2/promise';
import { Logger } from '@nestjs/common';

/**
 * 确保数据库存在
 */
export async function ensureDatabaseExists(configService: ConfigService): Promise<void> {
  const logger = new Logger('DatabaseInit');

  const host = configService.get('DB_HOST', 'localhost');
  const port = configService.get<number>('DB_PORT', 3306);
  const username = configService.get('DB_USERNAME', 'root');
  const password = configService.get('DB_PASSWORD', 'root');
  const database = configService.get('DB_DATABASE', 'blog');

  try {
    logger.log(`正在检查数据库 ${database} 是否存在...`);

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

    logger.log(`已成功创建/确认数据库 ${database} 存在`);

    // 关闭连接
    await connection.end();
  } catch (error) {
    logger.error(`创建数据库时出错: ${error.message}`);
    throw error;
  }
}

/**
 * 创建TypeORM配置
 */
export const createTypeOrmOptions = async (
  configService: ConfigService,
): Promise<TypeOrmModuleOptions> => {
  // 先确保数据库存在
  await ensureDatabaseExists(configService);

  return {
    type: 'mysql',
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 3306),
    username: configService.get('DB_USERNAME', 'root'),
    password: configService.get('DB_PASSWORD', 'root'),
    database: configService.get('DB_DATABASE', 'blog'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    synchronize: true,
    logging: configService.get<boolean>('DB_LOGGING', false),
    timezone: '+08:00',
    charset: 'utf8mb4',
  };
};
