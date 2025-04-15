import { MigrationInterface, QueryRunner } from 'typeorm';
import * as bcrypt from 'bcrypt';

/**
 * 初始化数据库基础数据
 * 创建管理员角色并分配给第一个用户
 */
export class InitializeMigrateData1718500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    console.log('开始初始化数据库基础数据...');

    // 1. 检查并创建管理员角色
    const [roleRows] = await queryRunner.query('SELECT * FROM roles WHERE role_label = ?', [
      'admin',
    ]);

    let adminRoleId: number = null;

    if (!roleRows || roleRows.length === 0) {
      console.log('创建管理员角色...');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await queryRunner.query(
        'INSERT INTO roles (roleName, role_label, remark, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        ['管理员', 'admin', '系统管理员，拥有所有权限', now, now],
      );
      adminRoleId = result.insertId;
      console.log('管理员角色创建成功，ID:', adminRoleId);
    } else {
      adminRoleId = roleRows[0].id;
      console.log('管理员角色已存在，ID:', adminRoleId);
    }

    // 2. 检查用户是否存在，如果不存在则创建默认管理员
    const [userRows] = await queryRunner.query('SELECT * FROM users ORDER BY id ASC LIMIT 1');

    let userId: number = null;

    if (!userRows || userRows.length === 0) {
      console.log('创建默认管理员用户...');
      // 创建密码hash
      const salt = await bcrypt.genSalt();
      const passwordHash = await bcrypt.hash('admin123', salt);

      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      const [result] = await queryRunner.query(
        'INSERT INTO users (username, nickname, password, avatar, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          'admin@blog.com',
          '管理员',
          passwordHash,
          'https://example.com/default-avatar.png',
          'admin@blog.com',
          now,
          now,
        ],
      );
      userId = result.insertId;
      console.log('默认管理员用户创建成功，ID:', userId);
    } else {
      userId = userRows[0].id;
      console.log('已存在用户，ID:', userId);
    }

    // 3. 为用户分配管理员角色
    const [userRoleRows] = await queryRunner.query(
      'SELECT * FROM user_roles WHERE user_id = ? AND role_id = ?',
      [userId, adminRoleId],
    );

    if (!userRoleRows || userRoleRows.length === 0) {
      console.log('为用户分配管理员角色...');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      await queryRunner.query(
        'INSERT INTO user_roles (user_id, role_id, created_at, updated_at) VALUES (?, ?, ?, ?)',
        [userId, adminRoleId, now, now],
      );
      console.log('管理员角色分配成功');
    } else {
      console.log('用户已拥有管理员角色');
    }

    // 4. 检查并创建基础站点配置
    const [configRows] = await queryRunner.query('SELECT * FROM site_config LIMIT 1');

    if (!configRows || configRows.length === 0) {
      console.log('创建默认站点配置...');
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');

      // 创建基础配置
      const configs = [
        { name: 'website.name', value: 'Conder Blog', remark: '网站名称' },
        { name: 'website.description', value: '个人博客系统', remark: '网站描述' },
        { name: 'website.logo', value: 'https://example.com/logo.png', remark: '网站Logo' },
        { name: 'website.notice', value: '欢迎来到我的博客', remark: '网站公告' },
        { name: 'website.recordNo', value: '', remark: '备案号' },
        { name: 'website.createTime', value: '2024-01-01', remark: '网站创建时间' },
        {
          name: 'about.content',
          value: '# 关于我\n\n这是一个使用Nest.js构建的个人博客系统。',
          remark: '关于我页面内容',
        },
      ];

      for (const config of configs) {
        await queryRunner.query(
          'INSERT INTO site_config (config_name, config_value, remark, is_frontend, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [config.name, config.value, config.remark, 1, now, now],
        );
      }

      console.log('默认站点配置创建成功');
    } else {
      console.log('站点配置已存在');
    }

    console.log('数据库初始化完成!');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 这里通常不需要实现回滚，因为初始化数据通常不需要回滚
    console.log('警告: 初始化数据回滚可能导致数据丢失');
  }
}
