import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import { DataSource } from 'typeorm';

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

// 创建数据源配置
const dataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_DATABASE || 'blog',
  entities: [__dirname + '/src/**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/src/migration/*{.ts,.js}'],
  synchronize: false,
  logging: true,
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
});

// 菜单ID与正确名称的映射
const menuIdToNameMap = {
  // 博客管理相关
  100: '博客管理',
  101: '发布文章',
  102: '文章列表',
  103: '分类管理',
  104: '标签管理',
  105: '文章编辑',

  // 消息管理相关
  200: '消息管理',
  201: '评论管理',
  202: '留言管理',

  // 系统管理相关
  300: '系统管理',
  301: '菜单管理',
  302: '角色管理',
  303: '用户管理',
  304: '文件管理',
  305: '系统接口',

  // 日志管理相关
  400: '日志管理',
  401: '操作日志',
  402: '异常日志',
  403: '访问日志',
  404: '任务日志',

  // 系统监控相关
  500: '系统监控',
  501: '在线用户',
  502: '定时任务',

  // 网站管理相关
  600: '网站管理',
  601: '友链管理',
  602: '说说管理',
  603: '相册管理',
  604: '照片管理',
  605: '网站配置',
  606: '轮播图',
};

// 执行菜单名称修复
async function fixMenuEncoding() {
  try {
    console.log('正在初始化数据库连接...');
    await dataSource.initialize();
    console.log('数据库连接成功！');

    // 查询所有菜单
    const menus = await dataSource.query('SELECT id, menu_name FROM t_menu');

    console.log(`找到 ${menus.length} 个菜单项`);

    // 遍历所有菜单，查找并修复乱码
    let updatedCount = 0;

    for (const menu of menus) {
      const menuId = menu.id;
      const menuName = menu.menu_name;

      // 检查是否需要修复（如果ID在映射表中存在）
      if (menuIdToNameMap[menuId]) {
        const correctName = menuIdToNameMap[menuId];

        // 只有当当前名称不正确时才更新
        if (menuName !== correctName) {
          console.log(`修复菜单 ID: ${menuId}, 原名称: [${menuName}], 更新为: [${correctName}]`);

          // 更新数据库
          await dataSource.query('UPDATE t_menu SET menu_name = ? WHERE id = ?', [
            correctName,
            menuId,
          ]);

          updatedCount++;
        }
      }
    }

    console.log(`菜单修复完成！共修复 ${updatedCount} 个菜单名称。`);
  } catch (error) {
    console.error('菜单修复过程中出错:', error);
  } finally {
    // 关闭数据库连接
    if (dataSource && dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('数据库连接已关闭');
    }
  }
}

// 执行脚本
fixMenuEncoding()
  .then(() => {
    console.log('菜单编码修复脚本执行完成');
    process.exit(0);
  })
  .catch((error) => {
    console.error('菜单编码修复脚本执行失败:', error);
    process.exit(1);
  });
