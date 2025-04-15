import * as mysql from 'mysql2/promise';

async function main() {
  console.log('开始修复管理员密码...');

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

    try {
      // 获取管理员用户
      const [users] = await connection.execute('SELECT * FROM t_user WHERE username = ?', [
        'admin',
      ]);

      // @ts-ignore - 忽略类型检查，users是一个数组
      if (users.length === 0) {
        console.log('未找到管理员用户，创建新用户...');

        // 创建管理员用户
        const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await connection.execute(
          'INSERT INTO t_user (username, nickname, password, email, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            'admin',
            '系统管理员',
            '$2a$10$oYi5RO6Th9xzyLrZiv9Rt.lVIs03Qz3TTocmKqAuITjhVVtZBO75O', // 123456加密后的密码
            'admin@example.com',
            now,
            now,
          ],
        );
        console.log('管理员用户创建成功!');
      } else {
        console.log('找到管理员用户，更新密码...');

        // 更新管理员密码
        await connection.execute('UPDATE t_user SET password = ? WHERE username = ?', [
          '$2a$10$oYi5RO6Th9xzyLrZiv9Rt.lVIs03Qz3TTocmKqAuITjhVVtZBO75O',
          'admin',
        ]);
        console.log('管理员密码更新成功!');
      }

      // 验证管理员密码已更新
      const [result] = await connection.execute(
        'SELECT id, username, password FROM t_user WHERE username = ?',
        ['admin'],
      );
      // @ts-ignore - 忽略类型检查，result是一个数组
      if (result.length > 0) {
        // @ts-ignore
        console.log(`管理员ID: ${result[0].id}, 密码哈希长度: ${result[0].password.length}`);
      }
    } catch (err) {
      console.error('数据库操作错误:', err);
    }

    // 关闭数据库连接
    await connection.end();
    console.log('管理员密码修复完成! 现在管理员账号为"admin"，密码为"123456"');
  } catch (error) {
    console.error('修复管理员密码时出错:', error);
  }
}

// 执行主函数
main().catch((error) => {
  console.error('程序执行失败:', error);
  process.exit(1);
});
