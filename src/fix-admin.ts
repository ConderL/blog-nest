import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';

// 加载环境变量
config();

// 创建数据库连接
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'wdrx4100',
  database: process.env.DB_DATABASE || 'blog',
  entities: ['dist/**/*.entity{.ts,.js}'],
  synchronize: false,
});

async function fixAdminUser() {
  try {
    // 初始化数据库连接
    await dataSource.initialize();
    console.log('数据库连接已初始化');

    // 开始事务
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // 查询数据库中是否有 admin 用户
      const admin = await queryRunner.manager.query('SELECT * FROM t_user WHERE username = ?', [
        'admin',
      ]);

      if (admin.length > 0) {
        console.log('找到 admin 用户，ID:', admin[0].id);

        // 更新密码为 admin123
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await queryRunner.manager.query(
          'UPDATE t_user SET password = ?, nickname = ? WHERE id = ?',
          [hashedPassword, 'Administrator', admin[0].id],
        );

        console.log('用户密码已重置为 admin123，昵称已更新为 Administrator');

        // 确保用户有管理员角色
        const adminRole = await queryRunner.manager.query(
          'SELECT * FROM t_user_role WHERE user_id = ? AND role_id = ?',
          [admin[0].id, '1'],
        );

        if (adminRole.length === 0) {
          await queryRunner.manager.query(
            'INSERT INTO t_user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [admin[0].id, '1'],
          );
          console.log('已为用户分配管理员角色');
        } else {
          console.log('用户已有管理员角色');
        }
      } else {
        console.log('未找到 admin 用户');

        // 创建新的管理员用户
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await queryRunner.manager.query(
          'INSERT INTO t_user (username, nickname, password, avatar, create_time, is_disable) VALUES (?, ?, ?, ?, NOW(), ?)',
          [
            'admin',
            'Administrator',
            hashedPassword,
            'https://picture.kramrs.space/config/5a08159479ba344dec5813e61fb6f79c.png',
            0,
          ],
        );

        console.log('已创建新的管理员用户: admin');

        // 获取新创建的用户ID
        const newAdmin = await queryRunner.manager.query(
          'SELECT id FROM t_user WHERE username = ?',
          ['admin'],
        );

        if (newAdmin.length > 0) {
          // 为管理员分配角色
          await queryRunner.manager.query(
            'INSERT INTO t_user_role (user_id, role_id, created_at, updated_at) VALUES (?, ?, NOW(), NOW())',
            [newAdmin[0].id, '1'], // 1 是管理员角色ID
          );

          console.log('已为新管理员分配管理员角色');
        }
      }

      // 提交事务
      await queryRunner.commitTransaction();
      console.log('修复成功');
    } catch (error) {
      // 出错时回滚事务
      await queryRunner.rollbackTransaction();
      console.error('修复过程中出错:', error);
    } finally {
      // 释放查询运行器
      await queryRunner.release();
    }
  } catch (error) {
    console.error('数据库连接失败:', error);
  } finally {
    // 关闭数据库连接
    if (dataSource.isInitialized) await dataSource.destroy();
    console.log('数据库连接已关闭');
  }
}

// 执行修复
fixAdminUser()
  .then(() => console.log('修复完成'))
  .catch((error) => console.error('修复失败:', error));
