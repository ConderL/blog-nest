/**
 * 数据库初始化脚本
 * 根据实体创建表结构并初始化基础数据
 */
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import * as fs from 'fs';
import * as path from 'path';

// 加载环境变量
dotenv.config();

// 创建一个完整的初始化过程
async function initializeDatabase() {
  console.log('===== 开始数据库初始化过程 =====');

  // 数据库连接配置
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_DATABASE || 'blog',
  };

  // 获取所有实体文件
  const entityFiles = [];
  const srcPath = path.join(__dirname);

  // 递归查找所有实体文件
  function findEntityFiles(dirPath: string) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        findEntityFiles(filePath);
      } else if (file.endsWith('.entity.js')) {
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

  // 创建数据库连接
  console.log('正在连接数据库...');
  console.log('数据库配置信息:');
  console.log(`- 主机: ${dbConfig.host}`);
  console.log(`- 端口: ${dbConfig.port}`);
  console.log(`- 用户名: ${dbConfig.username}`);
  console.log(`- 数据库: ${dbConfig.database}`);

  const dataSource = new DataSource({
    type: 'mysql',
    host: dbConfig.host,
    port: dbConfig.port,
    username: dbConfig.username,
    password: dbConfig.password,
    database: dbConfig.database,
    entities: entityFiles,
    synchronize: true, // 启用同步功能
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功!');

    // 在同步完成后执行数据初始化
    console.log('===== 开始初始化基础数据 =====');

    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 1. 检查并创建管理员角色
      const roleTableExists = await queryRunner.hasTable('t_role');
      if (roleTableExists) {
        console.log('检查管理员角色...');
        const roleRepo = dataSource.getRepository('t_role');
        const adminRole = await roleRepo.findOne({ where: { roleLabel: 'admin' } });

        if (!adminRole) {
          console.log('创建管理员角色...');
          const now = new Date();
          const role = roleRepo.create({
            roleName: '管理员',
            roleLabel: 'admin',
            remark: '系统管理员，拥有所有权限',
            createdAt: now,
            updatedAt: now,
          });
          await roleRepo.save(role);
          console.log('管理员角色创建成功!');
        } else {
          console.log('管理员角色已存在!');
        }

        // 2. 检查并创建管理员用户
        const userRepo = dataSource.getRepository('t_user');
        const adminUser = await userRepo.findOne({ where: { username: 'admin@blog.com' } });

        if (!adminUser) {
          console.log('创建管理员用户...');
          // 创建密码hash
          const salt = await bcrypt.genSalt();
          const passwordHash = await bcrypt.hash('admin123', salt);

          const now = new Date();
          const user = userRepo.create({
            username: 'admin@blog.com',
            nickname: '管理员',
            password: passwordHash,
            avatar: 'https://example.com/default-avatar.png',
            email: 'admin@blog.com',
            createdAt: now,
            updatedAt: now,
          });

          const savedUser = await userRepo.save(user);
          console.log('管理员用户创建成功!');

          // 3. 分配角色给用户
          const role = await roleRepo.findOne({ where: { roleLabel: 'admin' } });
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
          console.log('管理员用户已存在!');
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
    } finally {
      await queryRunner.release();
    }
  } catch (error) {
    console.error('数据库初始化失败:', error);
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }

  console.log('===== 数据库初始化过程结束 =====');
}

// 执行初始化
initializeDatabase()
  .then(() => {
    console.log('数据库完全初始化成功!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('数据库初始化过程中出错:', error);
    process.exit(1);
  });
